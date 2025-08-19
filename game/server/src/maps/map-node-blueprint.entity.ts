import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { MapBlueprint } from './map-blueprint.entity';
import { NodeKind } from '../common/types';

@Entity('map_node_blueprints')
export class MapNodeBlueprint {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MapBlueprint, (b) => b.nodes, { onDelete: 'CASCADE' })
  blueprint: MapBlueprint;

  @Column({ type: 'enum', enum: ['BASE','RESOURCE','DEFENSE','ARMY','SPECIAL'] })
  kind: NodeKind;

  @Column('int')
  x: number;

  @Column('int')
  y: number;
}
