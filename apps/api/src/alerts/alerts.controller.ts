import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { AlertsService } from './alerts.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  @RequirePermissions('alerts:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.alerts.list(user.tenantId);
  }

  @Post()
  @RequirePermissions('alerts:write')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: any) {
    return this.alerts.create(user.tenantId, dto);
  }

  @Get(':id/events')
  @RequirePermissions('alerts:read')
  events(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.alerts.events(user.tenantId, id);
  }
}
