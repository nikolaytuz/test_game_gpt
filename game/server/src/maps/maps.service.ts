import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MapBlueprint } from './map-blueprint.entity';

@Injectable()
export class MapsService {
  constructor(@InjectRepository(MapBlueprint) private blueprints: Repository<MapBlueprint>) {}

  async getBlueprint(id: number) {
    return this.blueprints.findOne({
      where: { id },
      relations: { nodes: true, edges: true },
    });
  }
}
