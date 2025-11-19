import { EchartsModule } from '@/backend/utils/echarts/echarts.module';
import { Module } from '@nestjs/common';
import { FichesModule } from '../../fiches/fiches.module';
import { PlanModule } from '../plans.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [PlanModule, FichesModule, EchartsModule],
  providers: [ReportsService],
  exports: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
