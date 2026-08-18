import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    tenantId: string;
    email: string;
    stage?: string;
  }): Promise<AuthenticatedUser> {
    // Tokens issued mid-2FA-flow (stage: 'pre_2fa') must never be accepted as full auth.
    if (payload.stage === 'pre_2fa') {
      throw new Error('Token not fully authenticated');
    }
    return { userId: payload.sub, tenantId: payload.tenantId, email: payload.email };
  }
}
