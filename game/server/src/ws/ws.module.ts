import { Module } from '@nestjs/common';
import { LobbyGateway } from './ws.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/match.entity';
import { MatchParticipant } from '../matches/match-participant.entity';
import { MapBlueprint } from '../maps/map-blueprint.entity';
import { MapNodeBlueprint } from '../maps/map-node-blueprint.entity';
import { MapEdgeBlueprint } from '../maps/map-edge-blueprint.entity';
import { User } from '../users/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RuntimeService } from '../matches/runtime.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Match, MatchParticipant, MapBlueprint, MapNodeBlueprint, MapEdgeBlueprint, User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.get('JWT_SECRET') })
    })
  ],
  providers: [LobbyGateway, RuntimeService]
})
export class WsModule {}
