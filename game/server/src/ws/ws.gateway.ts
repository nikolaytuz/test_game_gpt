import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Match } from '../matches/match.entity';
import { MatchParticipant } from '../matches/match-participant.entity';
import { MapBlueprint } from '../maps/map-blueprint.entity';
import { MapNodeBlueprint } from '../maps/map-node-blueprint.entity';
import { MapEdgeBlueprint } from '../maps/map-edge-blueprint.entity';
import { User } from '../users/user.entity';
import { MatchState, NodeState, Team } from '../common/types';
import { RuntimeService } from '../matches/runtime.service';
import { MIN_SEND_COOLDOWN_MS } from './constants';

interface SendTroopsPayload {
  matchId: string;
  fromNodeId: number;
  toNodeId: number;
  percent: 25 | 50 | 100;
}

@WebSocketGateway({ namespace: '/', path: '/ws' })
export class LobbyGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectRepository(Match) private matches: Repository<Match>,
    @InjectRepository(MatchParticipant) private participants: Repository<MatchParticipant>,
    @InjectRepository(MapBlueprint) private blueprints: Repository<MapBlueprint>,
    @InjectRepository(MapNodeBlueprint) private nodeRepo: Repository<MapNodeBlueprint>,
    @InjectRepository(MapEdgeBlueprint) private edgeRepo: Repository<MapEdgeBlueprint>,
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
    private runtime: RuntimeService
  ) {}

  private async getMatchState(match: Match): Promise<MatchState> {
    const players = await this.participants.find({ where: { match: { id: match.id } }, relations: ['user'] });
    const map = await this.blueprints.findOne({ where: { id: 1 }, relations: ['nodes', 'edges'] });
    const rt = this.runtime.getRuntime(match.id);
    let nodesState: NodeState[];
    let timer = undefined;
    let control = undefined;
    let domination = undefined;
    let winner = undefined;
    let reason = undefined;
    if (rt) {
      nodesState = Array.from(rt.nodes.values()).map((n) => ({ nodeId: n.nodeId, owner: n.owner, garrison: n.garrison }));
      timer = { startedAt: rt.startedAt, endsAt: rt.endsAt };
      const counts = (() => {
        let a = 0, b = 0, total = 0;
        for (const n of rt.nodes.values()) {
          const kind = rt.nodeKinds.get(n.nodeId);
          if (kind) total++;
          if (n.owner === 'A') a++;
          if (n.owner === 'B') b++;
        }
        return { a, b, total };
      })();
      control = counts;
      domination = rt.domination;
      winner = rt.winner;
      reason = rt.reason;
    } else {
      nodesState = map.nodes.map((n) => ({ nodeId: n.id, owner: n.id === 1 ? 'A' : n.id === 5 ? 'B' : null, garrison: 0 }));
    }
    return {
      matchId: match.id,
      players: players.map((p) => ({ userId: p.user.id, nickname: p.user.nickname, team: p.team })),
      map: { blueprintId: map.id, nodes: map.nodes, edges: map.edges },
      nodesState,
      timer,
      control,
      domination,
      winner,
      reason,
    };
  }

  @SubscribeMessage('lobby:create')
  async create(@MessageBody() body: { mapBlueprintId: number }, @ConnectedSocket() socket: Socket) {
    const token = socket.handshake.query['auth.token'] as string | undefined;
    let user: User = null;
    try {
      const payload: any = token ? this.jwt.verify(token) : null;
      user = payload ? await this.users.findOne({ where: { id: payload.sub } }) : null;
    } catch {
      return { ok: false };
    }
    if (!user) return { ok: false };

    const match = await this.matches.save(this.matches.create({ status: 'WAITING' }));
    const participant = this.participants.create({ match, user, team: 'A' });
    await this.participants.save(participant);
    socket.join(`match:${match.id}`);
    return { ok: true, matchId: match.id };
  }

  @SubscribeMessage('lobby:join')
  async join(@MessageBody() body: { matchId: string }, @ConnectedSocket() socket: Socket) {
    const token = socket.handshake.query['auth.token'] as string | undefined;
    let user: User = null;
    try {
      const payload: any = token ? this.jwt.verify(token) : null;
      user = payload ? await this.users.findOne({ where: { id: payload.sub } }) : null;
    } catch {
      return { ok: false };
    }
    if (!user) return { ok: false };

    const match = await this.matches.findOne({ where: { id: body.matchId } });
    if (!match) return { ok: false };
    const existing = await this.participants.find({ where: { match: { id: match.id } }, relations: ['user'] });
    let participant = existing.find((p) => p.user.id === user.id);
    if (!participant) {
      if (existing.length >= 2) return { ok: false };
      const team: Team = existing.find((p) => p.team === 'A') ? 'B' : 'A';
      participant = await this.participants.save(this.participants.create({ match, user, team }));
      existing.push({ ...participant, user });
    }
    socket.join(`match:${match.id}`);
    if (match.status === 'FINISHED') {
      const rt = this.runtime.getRuntime(match.id);
      const winner = rt?.winner;
      const reason = rt?.reason;
      socket.emit('match:over', { matchId: match.id, winner, reason, endedAt: Date.now() });
      return { ok: true, finished: true, winner, reason };
    }
    if (match.status === 'WAITING' && existing.length === 2) {
      await this.runtime.startMatch(match.id, this.server, {
        A: existing.find((p) => p.team === 'A')?.user.id,
        B: existing.find((p) => p.team === 'B')?.user.id,
      });
      match.status = 'RUNNING';
    }
    const state = await this.getMatchState(match);
    return { ok: true, state };
  }

  @SubscribeMessage('lobby:leave')
  leave(@ConnectedSocket() socket: Socket) {
    // Simply leave all rooms except own id
    Object.keys(socket.rooms).forEach((room) => { if (room !== socket.id) socket.leave(room); });
    return { ok: true };
  }

  @SubscribeMessage('match:sendTroops')
  async sendTroops(@MessageBody() payload: SendTroopsPayload, @ConnectedSocket() socket: Socket) {
    const token = socket.handshake.query['auth.token'] as string | undefined;
    let user: User = null;
    try {
      const payloadToken: any = token ? this.jwt.verify(token) : null;
      user = payloadToken ? await this.users.findOne({ where: { id: payloadToken.sub } }) : null;
    } catch {
      return { ok: false };
    }
    if (!user) return { ok: false };

    const runtime = this.runtime.getRuntime(payload.matchId);
    const match = await this.matches.findOne({ where: { id: payload.matchId } });
    if (!runtime || !match || match.status !== 'RUNNING') {
      return { ok: false, error: { code: 'MATCH_NOT_RUNNING' } };
    }

    const participant = await this.participants.findOne({ where: { match: { id: match.id }, user: { id: user.id } } });
    if (!participant) return { ok: false };
    const team = participant.team;
    const from = runtime.nodes.get(payload.fromNodeId);
    if (!from || from.owner !== team) {
      return { ok: false, error: { code: 'NOT_OWNER' } };
    }
    if (!this.runtime.isAdjacent(runtime.edges, payload.fromNodeId, payload.toNodeId)) {
      return { ok: false, error: { code: 'NOT_ADJACENT' } };
    }
    if (from.garrison <= 0) {
      return { ok: false, error: { code: 'NOT_ENOUGH_UNITS' } };
    }
    const last = runtime.lastSendByUser.get(user.id) || 0;
    const now = Date.now();
    if (now - last < MIN_SEND_COOLDOWN_MS) {
      return { ok: false, error: { code: 'TOO_FAST' } };
    }
    const qty = Math.floor((from.garrison * payload.percent) / 100);
    if (qty < 1) {
      return { ok: false, error: { code: 'NOT_ENOUGH_UNITS' } };
    }
    from.garrison -= qty;
    runtime.lastSendByUser.set(user.id, now);
    const convoy = this.runtime.enqueueConvoy(runtime, payload.fromNodeId, payload.toNodeId, team, qty);
    if (!convoy) return { ok: false, error: { code: 'NOT_ADJACENT' } };
    return { ok: true, convoy };
  }
}
