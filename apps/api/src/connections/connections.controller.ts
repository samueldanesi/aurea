import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { ConnectionsService } from './connections.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  @Get()
  @RequirePermissions('connections:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.connections.list(user.tenantId);
  }

  @Post()
  @RequirePermissions('connections:write')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    dto: {
      name: string;
      connectorType: string;
      config: Record<string, unknown>;
      credentials: Record<string, unknown>;
      syncSchedule?: string;
    },
  ) {
    return this.connections.create(user.tenantId, dto);
  }

  @Post(':id/sync')
  @RequirePermissions('connections:write')
  triggerSync(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.connections.triggerSync(user.tenantId, id);
  }

  @Get(':id/sync-logs')
  @RequirePermissions('connections:read')
  syncLogs(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.connections.syncLogs(user.tenantId, id);
  }
}
