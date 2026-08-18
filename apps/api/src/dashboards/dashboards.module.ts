import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardsService } from './dashboards.service';
import { DashboardsController } from './dashboards.controller';

@Module({
  imports: [AuthModule],
  providers: [DashboardsService],
  controllers: [DashboardsController],
  exports: [DashboardsService],
})
export class DashboardsModule {}
