import { Module } from '@nestjs/common';
import { ImportPlanRouter } from '@/backend/plans/fiches/import/import-plan.router';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { ImportPlanFetchService } from '@/backend/plans/fiches/import/import-plan-fetch.service';
import { ImportPlanCleanService } from '@/backend/plans/fiches/import/import-plan-clean.service';
import { ImportPlanSaveService } from '@/backend/plans/fiches/import/import-plan-save.service';
import { SharedModule } from '@/backend/shared/shared.module';
import { FichesActionModule } from '@/backend/plans/fiches/fiches.module';
import { AuthModule } from '@/backend/auth/auth.module';
import { CollectivitesModule } from '@/backend/collectivites/collectivites.module';

@Module({
  imports: [AuthModule, CollectivitesModule, SharedModule, FichesActionModule],
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
