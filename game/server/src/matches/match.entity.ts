import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { MatchParticipant } from './match-participant.entity';

export type MatchStatus = 'WAITING' | 'RUNNING' | 'FINISHED';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['WAITING', 'RUNNING', 'FINISHED'], default: 'WAITING' })
  status: MatchStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @OneToMany(() => MatchParticipant, (p) => p.match)
  participants: MatchParticipant[];

  @Column({ type: 'int', nullable: true })
  mapBlueprintId: number;
}
