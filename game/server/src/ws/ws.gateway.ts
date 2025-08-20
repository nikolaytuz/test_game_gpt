import { Injectable } from '@nestjs/common';
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
    const bp = await this.maps.getBlueprint(match.mapBlueprintId);
    const baseNodes = bp.nodes.filter((n) => n.kind === 'BASE');
    const nodesState = bp.nodes.map((n) => {
      let owner: 'A' | 'B' | null = null;
      if (baseNodes[0] && n.id === baseNodes[0].id) owner = 'A';
      if (baseNodes[1] && n.id === baseNodes[1].id) owner = 'B';
      return { nodeId: n.id, owner, garrison: 0 };
    });
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
      },
    };
  }
}
