import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Match } from './match.entity';
import { User } from '../users/user.entity';
import { Team } from '../common/types';

@Entity('match_participants')
export class MatchParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match, (match) => match.participants, { onDelete: 'CASCADE' })
  match: Match;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: ['A', 'B'] })
  team: Team;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
