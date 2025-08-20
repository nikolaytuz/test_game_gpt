import { Injectable, Inject, forwardRef } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Match } from '../matches/match.entity';
import { MatchParticipant } from '../matches/match-participant.entity';
import { MapsService } from '../maps/maps.service';
import { RuntimeService } from '../matches/runtime.service';
import { Team } from '../common/types';
import { MIN_SEND_COOLDOWN_MS } from './constants';

@WebSocketGateway({ path: '/ws', cors: { origin: '*' } })
@Injectable()
export class WsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwt: JwtService,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Match) private matches: Repository<Match>,
    @InjectRepository(MatchParticipant) private parts: Repository<MatchParticipant>,
    private maps: MapsService,
    @Inject(forwardRef(() => RuntimeService)) private runtime: RuntimeService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.query['auth.token'] as string) ||
      (client.handshake.headers['authorization']?.split(' ')[1] ?? '');
    try {
      const payload = await this.jwt.verifyAsync(token);
      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (!user) throw new Error('no user');
      client.data.user = user;
    } catch (e) {
      client.disconnect();
    }
  }

  @SubscribeMessage('lobby:create')
  async create(client: Socket, payload: { mapBlueprintId: number }) {
    const match = await this.matches.save(
      this.matches.create({ mapBlueprintId: payload.mapBlueprintId, status: 'WAITING' }),
    );
    await this.parts.save(
      this.parts.create({ match, user: client.data.user, team: 'A' }),
    );
    client.join(`match:${match.id}`);
    return { ok: true, matchId: match.id };
  }

  @SubscribeMessage('lobby:join')
  async join(client: Socket, payload: { matchId: string }) {
    const match = await this.matches.findOne({
      where: { id: payload.matchId },
      relations: { participants: { user: true } },
    });
    if (!match) return { ok: false };
    let participant = match.participants.find(
      (p) => p.user.id === client.data.user.id,
    );
    if (!participant) {
      const team = match.participants.find((p) => p.team === 'A') ? 'B' : 'A';
      participant = await this.parts.save(
        this.parts.create({ match, user: client.data.user, team }),
      );
      match.participants.push(participant);
    }
    client.join(`match:${match.id}`);
    let runtime = this.runtime.getRuntime(match.id);
    if (match.status === 'WAITING' && match.participants.length >= 2) {
      match.status = 'RUNNING';
      await this.matches.save(match);
      await this.runtime.startMatch(match.id, match.mapBlueprintId, {
        A: match.participants.find((p) => p.team === 'A')?.user.id,
        B: match.participants.find((p) => p.team === 'B')?.user.id,
      });
      runtime = this.runtime.getRuntime(match.id);
    }
    const bp = await this.maps.getBlueprint(match.mapBlueprintId);
    const nodesState = runtime
      ? Array.from(runtime.nodes.values()).map((n) => ({
          nodeId: n.nodeId,
          owner: n.owner,
          garrison: Math.floor(n.garrison),
        }))
      : bp.nodes.map((n) => ({ nodeId: n.id, owner: null, garrison: 0 }));
    const convoys = runtime
      ? Array.from(runtime.convoys.values()).map((c) => ({
          id: c.id,
          team: c.team,
          from: c.fromNodeId,
          to: c.toNodeId,
          total: c.total,
          departAt: c.departAt,
          arriveAt: c.arriveAt,
        }))
      : [];
    const players = match.participants.map((p) => ({
      userId: p.user.id,
      nickname: p.user.nickname,
      team: p.team,
    }));
    return {
      ok: true,
      state: {
        matchId: match.id,
        players,
        map: {
          blueprintId: bp.id,
          nodes: bp.nodes.map((n) => ({
            id: n.id,
            kind: n.kind,
            x: n.x,
            y: n.y,
          })),
          edges: bp.edges.map((e) => ({
            from: e.from.id,
            to: e.to.id,
            distance: e.distance,
          })),
        },
        nodesState,
        convoys,
      },
    };
  }

  @SubscribeMessage('match:sendTroops')
  async sendTroops(
    client: Socket,
    payload: { matchId: string; fromNodeId: number; toNodeId: number; percent: 25 | 50 | 100 },
  ) {
    const runtime = this.runtime.getRuntime(payload.matchId);
    if (!runtime || runtime.status !== 'RUNNING')
      return { ok: false, error: { code: 'MATCH_NOT_RUNNING' } };
    const userId = client.data.user.id as string;
    const team: Team | null =
      runtime.teams.A === userId
        ? 'A'
        : runtime.teams.B === userId
        ? 'B'
        : null;
    if (!team) return { ok: false };
    const from = runtime.nodes.get(payload.fromNodeId);
    const to = runtime.nodes.get(payload.toNodeId);
    if (!from || !to || from.owner !== team)
      return { ok: false, error: { code: 'NOT_OWNER' } };
    if (!this.runtime.isAdjacent(runtime.edges, payload.fromNodeId, payload.toNodeId))
      return { ok: false, error: { code: 'NOT_ADJACENT' } };
    const now = Date.now();
    const last = runtime.lastSendByUser.get(userId) || 0;
    if (now - last < MIN_SEND_COOLDOWN_MS)
      return { ok: false, error: { code: 'COOLDOWN' } };
    const qty = Math.floor((from.garrison * payload.percent) / 100);
    if (qty < 1) return { ok: false, error: { code: 'NOT_ENOUGH_UNITS' } };
    from.garrison -= qty;
    runtime.lastSendByUser.set(userId, now);
    const convoy = this.runtime.createConvoy(runtime, team, payload.fromNodeId, payload.toNodeId, qty);
    return {
      ok: true,
      convoy: {
        id: convoy.id,
        fromNodeId: convoy.fromNodeId,
        toNodeId: convoy.toNodeId,
        total: convoy.total,
        team: convoy.team,
        departAt: convoy.departAt,
        arriveAt: convoy.arriveAt,
      },
    };
  }
}
