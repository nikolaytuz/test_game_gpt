import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    @InjectRepository(User) private users: Repository<User>,
    private config: ConfigService
  ) {}

  async loginGuest() {
    // find unique guest nickname
    let nickname: string;
    let user: User | null = null;
    do {
      nickname = 'Guest' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      user = await this.users.findOne({ where: { nickname } });
    } while (user);

    user = this.users.create({ nickname });
    await this.users.save(user);

    const payload = { sub: user.id, nickname: user.nickname };
    const token = await this.jwt.signAsync(payload);
    return { token, user };
  }
}
