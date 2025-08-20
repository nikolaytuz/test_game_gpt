import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { MapBlueprint } from './map-blueprint.entity';
import { MapNodeBlueprint } from './map-node-blueprint.entity';

@Entity('map_edge_blueprints')
export class MapEdgeBlueprint {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MapBlueprint, (bp) => bp.edges, { onDelete: 'CASCADE' })
  blueprint: MapBlueprint;

  @ManyToOne(() => MapNodeBlueprint, { onDelete: 'CASCADE' })
  from: MapNodeBlueprint;

  @ManyToOne(() => MapNodeBlueprint, { onDelete: 'CASCADE' })
  to: MapNodeBlueprint;

  @Column('int')
  distance: number;
}
