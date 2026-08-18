import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from './platform-admin.guard';
import { TenantsService } from './tenants.service';

@UseGuards(PlatformAdminGuard)
@Controller('platform-admin/tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  list() {
    return this.tenants.list();
  }

  @Post()
  create(@Body() dto: { name: string; slug: string; plan?: string }) {
    return this.tenants.create(dto.name, dto.slug, dto.plan);
  }

  @Get(':id/usage')
  usage(@Param('id') id: string) {
    return this.tenants.usage(id);
  }
}
