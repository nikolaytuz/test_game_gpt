import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './users/user.entity';
import { MapBlueprint } from './maps/map-blueprint.entity';
import { MapNodeBlueprint } from './maps/map-node-blueprint.entity';
import { MapEdgeBlueprint } from './maps/map-edge-blueprint.entity';
import { Match } from './matches/match.entity';
import { MatchParticipant } from './matches/match-participant.entity';
import { AuthModule } from './auth/auth.module';
import { MapsModule } from './maps/maps.module';
import { WsGateway } from './ws/ws.gateway';
import { RuntimeService } from './matches/runtime.service';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get('DB_HOST'),
        port: parseInt(cfg.get('DB_PORT') || '3306'),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASS'),
        database: cfg.get('DB_NAME'),
        entities: [User, MapBlueprint, MapNodeBlueprint, MapEdgeBlueprint, Match, MatchParticipant],
        synchronize: false,
        charset: 'utf8mb4',
      }),
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get('JWT_EXPIRES') },
      }),
    }),
    TypeOrmModule.forFeature([User, Match, MatchParticipant]),
    AuthModule,
    MapsModule,
  ],
  controllers: [HealthController],
  providers: [WsGateway, RuntimeService],
})
export class AppModule {}
