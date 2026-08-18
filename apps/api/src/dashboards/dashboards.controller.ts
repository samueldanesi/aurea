import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { DashboardsService } from './dashboards.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboards: DashboardsService) {}

  @Get()
  @RequirePermissions('dashboards:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboards.list(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('dashboards:read')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.dashboards.get(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('dashboards:write')
  create(@CurrentUser() user: AuthenticatedUser, @Body('name') name: string) {
    return this.dashboards.create(user.tenantId, user.userId, name);
  }

  @Post(':id/widgets')
  @RequirePermissions('dashboards:write')
  addWidget(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() widget: { kind: string; title?: string; kpiKey?: string; config?: object; position?: object },
  ) {
    return this.dashboards.addWidget(user.tenantId, id, widget);
  }

  @Put(':id/layout')
  @RequirePermissions('dashboards:write')
  updateLayout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('layout') layout: unknown[],
  ) {
    return this.dashboards.updateLayout(user.tenantId, id, layout);
  }

  @Get(':id/export.pdf')
  @RequirePermissions('dashboards:read')
  async exportPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.dashboards.exportPdf(user.tenantId, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dashboard-${id}.pdf"`);
    res.send(pdf);
  }

  @Post(':id/embed-token')
  @RequirePermissions('dashboards:write')
  createEmbedToken(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const token = this.dashboards.createEmbedToken(user.tenantId, id);
    return { token };
  }

  @Post(':id/clone-template')
  @RequirePermissions('dashboards:write')
  cloneTemplate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.dashboards.cloneTemplate(user.tenantId, user.userId, id);
  }

  @Delete(':id')
  @RequirePermissions('dashboards:write')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.dashboards.remove(user.tenantId, id);
  }
}
