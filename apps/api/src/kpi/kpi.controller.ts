import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { KpiService } from './kpi.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('kpi-definitions')
export class KpiController {
  constructor(private readonly kpi: KpiService) {}

  @Get()
  @RequirePermissions('kpi:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.kpi.list(user.tenantId);
  }

  @Get(':key/history')
  @RequirePermissions('kpi:read')
  history(@CurrentUser() user: AuthenticatedUser, @Param('key') key: string) {
    return this.kpi.history(user.tenantId, key);
  }

  @Get(':key/values')
  @RequirePermissions('kpi:read')
  values(@CurrentUser() user: AuthenticatedUser, @Param('key') key: string) {
    return this.kpi.values(user.tenantId, key);
  }

  @Post()
  @RequirePermissions('kpi:write')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    dto: { key: string; label: string; description?: string; sqlExpression: string; unit?: string },
  ) {
    return this.kpi.create(user.tenantId, user.userId, dto);
  }
}
