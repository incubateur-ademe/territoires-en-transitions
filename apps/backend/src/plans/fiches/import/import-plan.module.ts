import { CollectivitesModule } from '@/backend/collectivites/collectivites.module';
import { FichesModule } from '@/backend/plans/fiches/fiches.module';
import { ImportPlanCleanService } from '@/backend/plans/fiches/import/import-plan-clean.service';
import { ImportPlanFetchService } from '@/backend/plans/fiches/import/import-plan-fetch.service';
import { ImportPlanSaveService } from '@/backend/plans/fiches/import/import-plan-save.service';
import { ImportPlanRouter } from '@/backend/plans/fiches/import/import-plan.router';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { PlanModule } from '@/backend/plans/plans/plans.module';
import { SharedModule } from '@/backend/shared/shared.module';
import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [
    forwardRef(() => CollectivitesModule),
    SharedModule,
    forwardRef(() => FichesModule),
    forwardRef(() => PlanModule),
  ],

  providers: [
    ImportPlanService,
    ImportPlanRouter,
    ImportPlanFetchService,
    ImportPlanCleanService,
    ImportPlanSaveService,
  ],
  exports: [
    ImportPlanService,
    ImportPlanRouter,
    ImportPlanFetchService,
    ImportPlanCleanService,
    ImportPlanSaveService,
  ],
})
export class ImportPlanModule {}
