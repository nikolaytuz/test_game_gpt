import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Match } from './match.entity';
import { User } from '../users/user.entity';

export type Team = 'A' | 'B';

@Entity('match_participants')
export class MatchParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match, (m) => m.participants, { onDelete: 'CASCADE' })
  match: Match;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: ['A', 'B'] })
  team: Team;

  @CreateDateColumn({ type: 'timestamp' })
  joined_at: Date;
}
