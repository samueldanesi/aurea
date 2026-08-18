import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { AiService } from './ai.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  @RequirePermissions('ai:chat')
  chat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { conversationId?: string; message: string },
  ) {
    return this.ai.chat(user.tenantId, user.userId, dto.conversationId ?? null, dto.message);
  }

  @Get('conversations/:id/messages')
  @RequirePermissions('ai:chat')
  history(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ai.history(user.tenantId, id);
  }
}
