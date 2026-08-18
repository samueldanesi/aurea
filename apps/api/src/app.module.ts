import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DbModule } from './common/db/db.module';
import { EngineClientModule } from './common/engine/engine-client.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { AuthModule } from './auth/auth.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { KpiModule } from './kpi/kpi.module';
import { ConnectionsModule } from './connections/connections.module';
import { AlertsModule } from './alerts/alerts.module';
import { AiModule } from './ai/ai.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';
import { EmbedModule } from './embed/embed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    EngineClientModule,
    AuthModule,
    DashboardsModule,
    KpiModule,
    ConnectionsModule,
    AlertsModule,
    AiModule,
    PlatformAdminModule,
    EmbedModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule {}
