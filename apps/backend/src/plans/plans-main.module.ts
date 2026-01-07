import { Module } from '@nestjs/common';
import { AxeModule } from './axes/axe.module';
import { FichesModule } from './fiches/fiches.module';
import { PlanMainRouter } from './plans-main.router';
import { GenerateReportsModule } from './plans/generate-plan-report-pptx/generate-reports.module';
import { PlanModule } from './plans/plans.module';
import { PlansUtilsModule } from './utils/plans-utils.module';

@Module({
  imports: [
    PlansUtilsModule,
    AxeModule,
    FichesModule,
    PlanModule,
    GenerateReportsModule,
  ],
  providers: [PlanMainRouter],
  exports: [PlanMainRouter],
})
export class PlanMainModule {}
