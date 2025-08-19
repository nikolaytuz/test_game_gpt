declare module '@nestjs/common' {
  export const Injectable: any;
  export const Module: any;
  export const Controller: any;
  export const Get: any;
  export const Post: any;
  export const Body: any;
  export const UseGuards: any;
  export const UsePipes: any;
  export const ValidationPipe: any;
  export const Logger: any;
}

declare module '@nestjs/core' {
  export class NestFactory {
    static create(...args: any[]): Promise<any>;
  }
}

declare module '@nestjs/platform-express' {}

declare module '@nestjs/websockets' {
  export const WebSocketGateway: any;
  export const SubscribeMessage: any;
  export const WebSocketServer: any;
  export const MessageBody: any;
  export const ConnectedSocket: any;
}

declare module '@nestjs/platform-socket.io' {}

declare module '@nestjs/config' {
  export class ConfigService {
    get<T = any>(key: string): T;
  }
}

declare module '@nestjs/jwt' {
  export class JwtService {
    sign(payload: any): string;
    verify(token: string): any;
  }
}

declare module 'bcrypt' {
  export function hash(data: any, rounds: number): Promise<string>;
  export function compare(data: any, hash: string): Promise<boolean>;
}

declare module 'class-transformer'

declare module 'class-validator'

declare module 'jsonwebtoken' {
  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string): any;
}

declare module 'mysql2'

declare module 'socket.io' {
  export class Server {
    to(room: string): any;
    emit(event: string, ...args: any[]): any;
  }
  export type Socket = any;
}

declare module 'typeorm' {
  export type MigrationInterface = any;
  export type QueryRunner = any;
  export class Repository<T = any> {
    findOne(options?: any): Promise<T | null>;
    save(entity: any): Promise<T>;
  }
  export class DataSource {
    constructor(options: any);
    initialize(): Promise<DataSource>;
    getRepository<T>(entity: any): Repository<T>;
  }
}

