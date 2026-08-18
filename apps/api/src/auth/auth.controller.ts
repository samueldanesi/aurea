import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyTwoFactorDto,
  ConfirmTwoFactorDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.tenantSlug, dto.email, dto.password, dto.fullName);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.tenantSlug, dto.email, dto.password);
    if (!user) {
      return { error: 'invalid_credentials' };
    }
    return this.auth.login(user);
  }

  @Post('2fa/verify')
  verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
    return this.auth.verifyTwoFactor(dto.preAuthToken, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enroll')
  enrollTwoFactor(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.enrollTwoFactor(user.userId, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/confirm')
  confirmTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmTwoFactorDto,
  ) {
    return this.auth.confirmTwoFactor(user.userId, user.tenantId, dto.code);
  }
}
