import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MapBlueprint } from './map-blueprint.entity';

@Controller('maps')
export class MapsController {
  constructor(@InjectRepository(MapBlueprint) private repo: Repository<MapBlueprint>) {}

  @Get('blueprints/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.repo.findOne({ where: { id } });
  }
}
