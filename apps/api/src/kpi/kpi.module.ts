import { Module } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { KpiController } from './kpi.controller';

@Module({
  providers: [KpiService],
  controllers: [KpiController],
})
export class KpiModule {}
