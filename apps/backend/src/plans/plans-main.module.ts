import { Module } from '@nestjs/common';
import { AxeModule } from './axes/axe.module';
import { FichesModule } from './fiches/fiches.module';
import { PartnerApiModule } from './partner-api/partner-api.module';
import { PlanMainRouter } from './plans-main.router';
import { PlanModule } from './plans/plans.module';
import { ReportsModule } from './reports/reports.module';
import { PlansUtilsModule } from './utils/plans-utils.module';

@Module({
  imports: [
    PlansUtilsModule,
    AxeModule,
    FichesModule,
    PlanModule,
    ReportsModule,
    PartnerApiModule,
  ],
  providers: [PlanMainRouter],
  exports: [PlanMainRouter],
})
export class PlanMainModule {}
