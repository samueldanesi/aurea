import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { DbService } from '../common/db/db.service';

interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DbService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Registration always resolves the tenant by slug first -- users never
   * choose an arbitrary tenant id, which would let one tenant enumerate
   * or attach itself to another's account.
   */
  async register(
    tenantSlug: string,
    email: string,
    password: string,
    fullName: string,
  ) {
    return this.db.withoutTenant(async (client) => {
      const tenantRes = await client.query(
        'SELECT id FROM app.tenants WHERE slug = $1 AND is_active = true',
        [tenantSlug],
      );
      if (tenantRes.rowCount === 0) {
        throw new BadRequestException('Tenant not found');
      }
      const tenantId = tenantRes.rows[0].id;

      const existing = await client.query(
        'SELECT id FROM app.users WHERE tenant_id = $1 AND email = $2',
        [tenantId, email],
      );
      if ((existing.rowCount ?? 0) > 0) {
        throw new ConflictException('Email already registered for this tenant');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userRes = await client.query(
        `INSERT INTO app.users (tenant_id, email, password_hash, full_name)
         VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, email, full_name`,
        [tenantId, email, passwordHash, fullName],
      );
      return userRes.rows[0];
    });
  }

  async validateUser(tenantSlug: string, email: string, password: string) {
    return this.db.withoutTenant(async (client) => {
      const res = await client.query(
        `SELECT u.id, u.tenant_id, u.email, u.password_hash, u.totp_enabled
         FROM app.users u
         JOIN app.tenants t ON t.id = u.tenant_id
         WHERE t.slug = $1 AND u.email = $2 AND u.is_active = true`,
        [tenantSlug, email],
      );
      if (res.rowCount === 0) return null;
      const user = res.rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      return ok ? user : null;
    });
  }

  async login(user: {
    id: string;
    tenant_id: string;
    email: string;
    totp_enabled: boolean;
  }) {
    if (user.totp_enabled) {
      // Password step succeeded; caller must now call /auth/2fa/verify with a TOTP code
      // before receiving a usable access token.
      const preAuthToken = this.jwt.sign(
        { sub: user.id, tenantId: user.tenant_id, email: user.email, stage: 'pre_2fa' },
        { expiresIn: '5m' },
      );
      return { requiresTwoFactor: true, preAuthToken };
    }
    return this.issueToken(user.id, user.tenant_id, user.email);
  }

  async verifyTwoFactor(preAuthToken: string, code: string) {
    let payload: JwtPayload & { stage?: string };
    try {
      payload = this.jwt.verify(preAuthToken);
    } catch {
      throw new UnauthorizedException('Pre-auth token invalid or expired');
    }
    if (payload.stage !== 'pre_2fa') {
      throw new UnauthorizedException('Invalid token stage');
    }

    const secret = await this.db.withoutTenant(async (client) => {
      const res = await client.query(
        'SELECT totp_secret FROM app.users WHERE id = $1',
        [payload.sub],
      );
      return res.rows[0]?.totp_secret;
    });
    if (!secret || !authenticator.verify({ token: code, secret })) {
      throw new UnauthorizedException('Invalid 2FA code');
    }
    return this.issueToken(payload.sub, payload.tenantId, payload.email);
  }

  async enrollTwoFactor(userId: string, tenantId: string) {
    const secret = authenticator.generateSecret();
    await this.db.withTenant(tenantId, (client) =>
      client.query('UPDATE app.users SET totp_secret = $1 WHERE id = $2', [
        secret,
        userId,
      ]),
    );
    const otpauthUrl = authenticator.keyuri(userId, 'BI-AI-Platform', secret);
    return { secret, otpauthUrl };
  }

  async confirmTwoFactor(userId: string, tenantId: string, code: string) {
    const secret = await this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        'SELECT totp_secret FROM app.users WHERE id = $1',
        [userId],
      );
      return res.rows[0]?.totp_secret;
    });
    if (!secret || !authenticator.verify({ token: code, secret })) {
      throw new UnauthorizedException('Invalid 2FA code');
    }
    await this.db.withTenant(tenantId, (client) =>
      client.query('UPDATE app.users SET totp_enabled = true WHERE id = $1', [
        userId,
      ]),
    );
    return { enabled: true };
  }

  private issueToken(userId: string, tenantId: string, email: string) {
    const payload: JwtPayload = { sub: userId, tenantId, email };
    return {
      accessToken: this.jwt.sign(payload),
      tokenType: 'Bearer',
    };
  }
}
