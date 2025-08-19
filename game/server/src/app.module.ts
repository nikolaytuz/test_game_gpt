import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppDataSource } from '../data-source';
import { User } from './users/user.entity';
import { Match } from './matches/match.entity';
import { MatchParticipant } from './matches/match-participant.entity';
import { MapBlueprint } from './maps/map-blueprint.entity';
import { MapNodeBlueprint } from './maps/map-node-blueprint.entity';
import { MapEdgeBlueprint } from './maps/map-edge-blueprint.entity';
import { AuthModule } from './auth/auth.module';
import { MapsModule } from './maps/maps.module';
import { WsModule } from './ws/ws.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...AppDataSource.options, autoLoadEntities: true }),
    }),
    TypeOrmModule.forFeature([User, Match, MatchParticipant, MapBlueprint, MapNodeBlueprint, MapEdgeBlueprint]),
    AuthModule,
    MapsModule,
    WsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
