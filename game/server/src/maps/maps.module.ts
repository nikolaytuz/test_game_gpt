import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapBlueprint } from './map-blueprint.entity';
import { MapNodeBlueprint } from './map-node-blueprint.entity';
import { MapEdgeBlueprint } from './map-edge-blueprint.entity';
import { MapsController } from './maps.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MapBlueprint, MapNodeBlueprint, MapEdgeBlueprint])],
  controllers: [MapsController]
})
export class MapsModule {}
