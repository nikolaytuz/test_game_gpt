import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MapNodeBlueprint } from './map-node-blueprint.entity';
import { MapEdgeBlueprint } from './map-edge-blueprint.entity';

@Entity('map_blueprints')
export class MapBlueprint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => MapNodeBlueprint, (n) => n.blueprint)
  nodes: MapNodeBlueprint[];

  @OneToMany(() => MapEdgeBlueprint, (e) => e.blueprint)
  edges: MapEdgeBlueprint[];
}
