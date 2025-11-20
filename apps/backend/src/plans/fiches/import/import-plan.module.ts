import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { ImportPlanCleanService } from '@tet/backend/plans/fiches/import/import-plan-clean.service';
import { ImportPlanFetchService } from '@tet/backend/plans/fiches/import/import-plan-fetch.service';
import { ImportPlanSaveService } from '@tet/backend/plans/fiches/import/import-plan-save.service';
import { ImportPlanRouter } from '@tet/backend/plans/fiches/import/import-plan.router';
import { ImportPlanService } from '@tet/backend/plans/fiches/import/import-plan.service';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';
import { SharedModule } from '@tet/backend/shared/shared.module';

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
