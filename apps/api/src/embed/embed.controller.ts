import { Controller, Get, Param, Query } from '@nestjs/common';
import { EmbedService } from './embed.service';

// Deliberately outside JwtAuthGuard: this is the public surface consumed by an
// <iframe> on a third-party site. Authorization comes entirely from the
// possession of a valid embed token (see DashboardsService.createEmbedToken),
// not from a cookie/session -- so it works cross-origin, embedded, logged out.
@Controller('public/dashboards')
export class EmbedController {
  constructor(private readonly embed: EmbedService) {}

  @Get(':id')
  get(@Param('id') id: string, @Query('token') token: string) {
    return this.embed.getEmbeddedDashboard(id, token);
  }
}
