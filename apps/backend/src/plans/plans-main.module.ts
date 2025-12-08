import { Module } from '@nestjs/common';
import { AxeModule } from './axes/axe.module';
import { FichesModule } from './fiches/fiches.module';
import { PlanMainRouter } from './plans-main.router';
import { PlanModule } from './plans/plans.module';

@Module({
  imports: [AxeModule, FichesModule, PlanModule],
  providers: [PlanMainRouter],
  exports: [PlanMainRouter],
})
export class PlanMainModule {}
