import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { MapBlueprint } from '../maps/map-blueprint.entity';
import { MatchRuntime, Convoy } from './runtime.types';
import { Team } from '../common/types';
import {
  TICK_RATE,
  BROADCAST_RATE,
  UNIT_SPEED,
  MATCH_DURATION_SEC,
  DOMINATION_THRESHOLD,
  DOMINATION_HOLD_SEC,
  MAX_GARRISON,
} from '../ws/constants';
import { randomUUID } from 'crypto';
import { Server } from 'socket.io';

@Injectable()
export class RuntimeService {
  private runtimes = new Map<string, MatchRuntime>();
  private server: Server;

  constructor(
    @InjectRepository(MapBlueprint) private blueprints: Repository<MapBlueprint>,
    @InjectRepository(Match) private matches: Repository<Match>
  ) {}

  getRuntime(matchId: string) {
    return this.runtimes.get(matchId);
  }

  async startMatch(matchId: string, server: Server, teams: { A?: string; B?: string }) {
    this.server = server;
    const blueprint = await this.blueprints.findOne({ where: { id: 1 }, relations: ['nodes', 'edges'] });
    if (!blueprint) return;
    const now = Date.now();
    const runtime: MatchRuntime = {
      matchId,
      blueprintId: blueprint.id,
      status: 'RUNNING',
      nodes: new Map(),
      convoys: new Map(),
      edges: blueprint.edges.map((e) => ({ from: e.from.id, to: e.to.id, distance: e.distance })),
      nodeKinds: new Map(blueprint.nodes.map((n) => [n.id, n.kind])),
      lastBroadcastAt: now,
      lastTickAt: now,
      lastSendByUser: new Map(),
      teams,
      startedAt: now,
      endsAt: now + MATCH_DURATION_SEC * 1000,
      domination: { leader: null, sinceMs: null },
    };
    blueprint.nodes.forEach((n) => {
      let owner: 'A' | 'B' | null = null;
      let garrison = 0;
      let prodPerSec = 0;
      if (n.id === 1) {
        owner = 'A';
        garrison = 10;
        prodPerSec = 1;
      } else if (n.id === 5) {
        owner = 'B';
        garrison = 10;
        prodPerSec = 1;
      } else if (n.kind === 'ARMY') {
        prodPerSec = 0.8;
      }
      runtime.nodes.set(n.id, { nodeId: n.id, owner, garrison, prodPerSec });
    });
    this.runtimes.set(matchId, runtime);
    await this.matches.update({ id: matchId }, { status: 'RUNNING' });
    const tickMs = 1000 / TICK_RATE;
    const broadcastMs = 1000 / BROADCAST_RATE;
    runtime.tickHandle = setInterval(() => {
      const now = Date.now();
      const delta = (now - runtime.lastTickAt) / 1000;
      this.applyTick(runtime, now, delta);
      runtime.lastTickAt = now;
    }, tickMs);
    runtime.broadcastHandle = setInterval(() => {
      const now = Date.now();
      const nodesState = Array.from(runtime.nodes.values()).map((n) => ({ nodeId: n.nodeId, owner: n.owner, garrison: n.garrison }));
      const convoys = Array.from(runtime.convoys.values());
      const control = this.countControl(runtime);
      this.server
        .to(`match:${matchId}`)
        .emit('match:state', {
          now,
          nodesState,
          convoys,
          timer: { startedAt: runtime.startedAt, endsAt: runtime.endsAt },
          control,
          domination: runtime.domination,
        });
      runtime.lastBroadcastAt = now;
    }, broadcastMs);
  }

  stopMatch(matchId: string) {
    const rt = this.runtimes.get(matchId);
    if (!rt) return;
    if (rt.tickHandle) clearInterval(rt.tickHandle);
    if (rt.broadcastHandle) clearInterval(rt.broadcastHandle);
    this.runtimes.delete(matchId);
    this.matches.update({ id: matchId }, { status: 'FINISHED' });
  }

  applyTick(runtime: MatchRuntime, now: number, deltaSec: number) {
    for (const node of runtime.nodes.values()) {
      if (node.owner && node.prodPerSec > 0) {
        node.garrison += node.prodPerSec * deltaSec;
      }
      node.garrison = Math.min(MAX_GARRISON, Math.floor(node.garrison));
    }
    for (const convoy of Array.from(runtime.convoys.values())) {
      if (now >= convoy.arriveAt) {
        this.resolveArrival(runtime, convoy);
        runtime.convoys.delete(convoy.id);
      }
    }
    this.evaluateWinConditions(runtime, now);
  }

  resolveArrival(runtime: MatchRuntime, convoy: Convoy) {
    const dst = runtime.nodes.get(convoy.toNodeId);
    if (!dst) return;
    const prevOwner = dst.owner;
    if (dst.owner === convoy.team) {
      dst.garrison += convoy.total;
    } else if (dst.owner === null) {
      dst.owner = convoy.team;
      dst.garrison = convoy.total;
    } else if (dst.owner !== convoy.team) {
      if (convoy.total > dst.garrison) {
        const rem = convoy.total - dst.garrison;
        dst.owner = convoy.team;
        dst.garrison = rem;
      } else {
        dst.garrison -= convoy.total;
      }
    }
    const kind = runtime.nodeKinds.get(convoy.toNodeId);
    if (
      kind === 'BASE' &&
      prevOwner &&
      prevOwner !== convoy.team &&
      dst.owner === convoy.team
    ) {
      this.finishMatch(runtime, convoy.team as Team, 'BASE_CAPTURE');
    }
  }

  isAdjacent(edges: MatchRuntime['edges'], fromId: number, toId: number) {
    return edges.some((e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId));
  }

  enqueueConvoy(runtime: MatchRuntime, fromNodeId: number, toNodeId: number, team: string, qty: number) {
    const edge = runtime.edges.find((e) => (e.from === fromNodeId && e.to === toNodeId) || (e.from === toNodeId && e.to === fromNodeId));
    if (!edge) return null;
    const now = Date.now();
    const travelSec = edge.distance / UNIT_SPEED;
    const convoy: Convoy = {
      id: randomUUID(),
      team: team as any,
      fromNodeId,
      toNodeId,
      total: qty,
      departAt: now,
      arriveAt: now + travelSec * 1000,
    };
    runtime.convoys.set(convoy.id, convoy);
    return convoy;
  }

  private countControl(runtime: MatchRuntime) {
    let a = 0;
    let b = 0;
    let total = 0;
    for (const node of runtime.nodes.values()) {
      const kind = runtime.nodeKinds.get(node.nodeId);
      if (kind) total++;
      if (node.owner === 'A') a++;
      if (node.owner === 'B') b++;
    }
    return { a, b, total };
  }

  private evaluateWinConditions(runtime: MatchRuntime, now: number) {
    if (runtime.winner) return;

    if (now >= runtime.endsAt) {
      const { a, b } = this.countControl(runtime);
      const winner: Team = a === b ? 'A' : a > b ? 'A' : 'B';
      this.finishMatch(runtime, winner, 'TIMEOUT');
      return;
    }

    const { a, b, total } = this.countControl(runtime);
    const aShare = a / total;
    const bShare = b / total;
    let leader: Team | null = null;
    if (aShare >= DOMINATION_THRESHOLD) leader = 'A';
    else if (bShare >= DOMINATION_THRESHOLD) leader = 'B';

    if (leader) {
      if (runtime.domination.leader !== leader) {
        runtime.domination.leader = leader;
        runtime.domination.sinceMs = now;
      } else if (runtime.domination.sinceMs && now - runtime.domination.sinceMs >= DOMINATION_HOLD_SEC * 1000) {
        this.finishMatch(runtime, leader, 'DOMINATION');
      }
    } else {
      runtime.domination.leader = null;
      runtime.domination.sinceMs = null;
    }
  }

  private finishMatch(runtime: MatchRuntime, winner: Team, reason: 'BASE_CAPTURE' | 'DOMINATION' | 'TIMEOUT') {
    if (runtime.winner) return;
    runtime.winner = winner;
    runtime.reason = reason;
    runtime.status = 'FINISHED';
    if (runtime.tickHandle) clearInterval(runtime.tickHandle);
    if (runtime.broadcastHandle) clearInterval(runtime.broadcastHandle);
    this.matches.update({ id: runtime.matchId }, { status: 'FINISHED' });
    this.server
      .to(`match:${runtime.matchId}`)
      .emit('match:over', { matchId: runtime.matchId, winner, reason, endedAt: Date.now() });
  }
}
