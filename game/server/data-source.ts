import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  charset: 'utf8mb4',
  timezone: process.env.DB_TZ ?? 'Z',
  ssl: process.env.DB_SSL === 'true'
});
