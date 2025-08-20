import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class MapsController {
  constructor(private maps: MapsService) {}

  @Get('blueprints/:id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const bp = await this.maps.getBlueprint(id);
    if (!bp) return null;
    return {
      id: bp.id,
      name: bp.name,
      nodes: bp.nodes.map((n) => ({ id: n.id, kind: n.kind, x: n.x, y: n.y })),
      edges: bp.edges.map((e) => ({ from: e.from.id, to: e.to.id, distance: e.distance })),
    };
  }
}
