import { Module } from '@nestjs/common';
import { FichesModule } from '../fiches/fiches.module';
import { PlanModule } from '../plans/plans.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [PlanModule, FichesModule],
  providers: [ReportsService],
  exports: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}

