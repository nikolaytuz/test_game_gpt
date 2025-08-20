import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Match } from './matches/match.entity';
import { MatchParticipant } from './matches/match-participant.entity';
import { MapBlueprint } from './maps/map-blueprint.entity';
import { MapNodeBlueprint } from './maps/map-node-blueprint.entity';
import { MapEdgeBlueprint } from './maps/map-edge-blueprint.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [User, Match, MatchParticipant, MapBlueprint, MapNodeBlueprint, MapEdgeBlueprint],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  charset: 'utf8mb4',
});

export default AppDataSource;
