import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { MapBlueprint } from './map-blueprint.entity';

export type NodeKind = 'BASE' | 'RESOURCE' | 'DEFENSE' | 'ARMY' | 'SPECIAL';

@Entity('map_node_blueprints')
export class MapNodeBlueprint {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MapBlueprint, (bp) => bp.nodes, { onDelete: 'CASCADE' })
  blueprint: MapBlueprint;

  @Column({ type: 'enum', enum: ['BASE', 'RESOURCE', 'DEFENSE', 'ARMY', 'SPECIAL'] })
  kind: NodeKind;

  @Column('int')
  x: number;

  @Column('int')
  y: number;
}
