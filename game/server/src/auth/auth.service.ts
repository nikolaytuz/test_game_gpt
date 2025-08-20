import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async loginGuest() {
    let nickname: string;
    let user: User | null = null;
    while (!user) {
      nickname = `Guest${randomInt(1000, 9999)}`;
      user = await this.users.findOne({ where: { nickname } });
      if (!user) {
        user = this.users.create({ nickname });
        user = await this.users.save(user);
      }
    }
    const token = await this.jwt.signAsync({ sub: user.id });
    return { token, user: { id: user.id, nickname: user.nickname } };
  }
}
