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
    private jwt: JwtService
  ) {}

  private async getMatchState(match: Match): Promise<MatchState> {
    const players = await this.participants.find({ where: { match: { id: match.id } }, relations: ['user'] });
    const map = await this.blueprints.findOne({ where: { id: 1 }, relations: ['nodes', 'edges'] });
    const nodesState: NodeState[] = map.nodes.map((n) => ({
      nodeId: n.id,
      owner: n.id === 1 ? 'A' : n.id === 5 ? 'B' : null,
      garrison: 0
    }));
    return {
      matchId: match.id,
      players: players.map((p) => ({ userId: p.user.id, nickname: p.user.nickname, team: p.team })),
      map: { blueprintId: map.id, nodes: map.nodes, edges: map.edges },
      nodesState
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
    if (!match || match.status !== 'WAITING') return { ok: false };
    const existing = await this.participants.find({ where: { match: { id: match.id } } });
    if (existing.find((p) => p.user.id === user.id)) {
      // already joined
    } else if (existing.length >= 2) {
      return { ok: false };
    } else {
      const team: Team = existing.find((p) => p.team === 'A') ? 'B' : 'A';
      await this.participants.save(this.participants.create({ match, user, team }));
    }
    socket.join(`match:${match.id}`);
    const state = await this.getMatchState(match);
    return { ok: true, state };
  }

  @SubscribeMessage('lobby:leave')
  leave(@ConnectedSocket() socket: Socket) {
    // Simply leave all rooms except own id
    Object.keys(socket.rooms).forEach((room) => { if (room !== socket.id) socket.leave(room); });
    return { ok: true };
  }
}
