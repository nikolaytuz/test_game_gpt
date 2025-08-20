import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { MapsService } from '../maps/maps.service';
import { WsGateway } from '../ws/ws.gateway';
import { MatchRuntime, Convoy } from './runtime.types';
import {
  TICK_RATE,
  BROADCAST_RATE,
  UNIT_SPEED,
  START_GARRISON_BASE,
  START_GARRISON_OTHER,
} from '../ws/constants';
import { randomUUID } from 'crypto';
import { Team } from '../common/types';

@Injectable()
export class RuntimeService {
  private runtimes = new Map<string, MatchRuntime>();

  constructor(
    private maps: MapsService,
    @Inject(forwardRef(() => WsGateway)) private ws: WsGateway,
  ) {}

  getRuntime(matchId: string) {
    return this.runtimes.get(matchId);
  }

  async startMatch(matchId: string, blueprintId: number, teams: { A?: string; B?: string }) {
    const bp = await this.maps.getBlueprint(blueprintId);
    if (!bp) return;
    const runtime: MatchRuntime = {
      matchId,
      blueprintId,
      status: 'RUNNING',
      nodes: new Map(),
      convoys: new Map(),
      edges: bp.edges.map((e) => ({ from: e.from.id, to: e.to.id, distance: e.distance })),
      lastBroadcastAt: Date.now(),
      lastSendByUser: new Map(),
      teams,
    };
    const baseNodes = bp.nodes.filter((n) => n.kind === 'BASE');
    for (const n of bp.nodes) {
      let owner: Team | null = null;
      let garrison = START_GARRISON_OTHER;
      let prodPerSec = 0;
      if (baseNodes[0] && n.id === baseNodes[0].id) {
        owner = 'A';
        garrison = START_GARRISON_BASE;
        prodPerSec = 1;
      } else if (baseNodes[1] && n.id === baseNodes[1].id) {
        owner = 'B';
        garrison = START_GARRISON_BASE;
        prodPerSec = 1;
      } else if (n.kind === 'ARMY') {
        prodPerSec = 0.8;
      }
      runtime.nodes.set(n.id, {
        nodeId: n.id,
        owner,
        garrison,
        prodPerSec,
      });
    }
    runtime.tickHandle = setInterval(() => this.tick(matchId), 1000 / TICK_RATE);
    runtime.broadcastHandle = setInterval(() => this.broadcast(matchId), 1000 / BROADCAST_RATE);
    this.runtimes.set(matchId, runtime);
  }

  stopMatch(matchId: string) {
    const rt = this.runtimes.get(matchId);
    if (!rt) return;
    if (rt.tickHandle) clearInterval(rt.tickHandle);
    if (rt.broadcastHandle) clearInterval(rt.broadcastHandle);
    this.runtimes.delete(matchId);
  }

  tick(matchId: string) {
    const rt = this.runtimes.get(matchId);
    if (!rt) return;
    for (const node of rt.nodes.values()) {
      node.garrison += node.prodPerSec / TICK_RATE;
    }
    const now = Date.now();
    for (const convoy of Array.from(rt.convoys.values())) {
      if (now >= convoy.arriveAt) {
        this.resolveArrival(rt, convoy);
        rt.convoys.delete(convoy.id);
      }
    }
  }

  private resolveArrival(rt: MatchRuntime, convoy: Convoy) {
    const dst = rt.nodes.get(convoy.toNodeId);
    if (!dst) return;
    if (dst.owner === convoy.team) {
      dst.garrison += convoy.total;
    } else if (dst.owner === null) {
      dst.owner = convoy.team;
      dst.garrison = convoy.total;
    } else {
      const rem = convoy.total - dst.garrison;
      if (rem > 0) {
        dst.owner = convoy.team;
        dst.garrison = rem;
      } else {
        dst.garrison = -rem;
      }
    }
  }

  broadcast(matchId: string) {
    const rt = this.runtimes.get(matchId);
    if (!rt) return;
    const now = Date.now();
    const nodesState = Array.from(rt.nodes.values()).map((n) => ({
      nodeId: n.nodeId,
      owner: n.owner,
      garrison: Math.floor(n.garrison),
    }));
    const convoys = Array.from(rt.convoys.values()).map((c) => ({
      id: c.id,
      team: c.team,
      from: c.fromNodeId,
      to: c.toNodeId,
      total: c.total,
      departAt: c.departAt,
      arriveAt: c.arriveAt,
    }));
    this.ws.server.to(`match:${matchId}`).emit('match:state', {
      now,
      nodesState,
      convoys,
    });
    rt.lastBroadcastAt = now;
  }

  isAdjacent(edges: MatchRuntime['edges'], fromId: number, toId: number) {
    return edges.some(
      (e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId),
    );
  }

  createConvoy(
    rt: MatchRuntime,
    team: Team,
    fromNodeId: number,
    toNodeId: number,
    qty: number,
  ) {
    const now = Date.now();
    const edge = rt.edges.find(
      (e) =>
        (e.from === fromNodeId && e.to === toNodeId) ||
        (e.from === toNodeId && e.to === fromNodeId),
    );
    const dist = edge ? edge.distance : 0;
    const travelSec = dist / UNIT_SPEED;
    const convoy: Convoy = {
      id: randomUUID(),
      team,
      fromNodeId,
      toNodeId,
      total: qty,
      departAt: now,
      arriveAt: now + travelSec * 1000,
    };
    rt.convoys.set(convoy.id, convoy);
    return convoy;
  }
}
