import { CollectivitesModule } from '@/backend/collectivites/collectivites.module';
import { FichesModule } from '@/backend/plans/fiches/fiches.module';
import { ImportPlanSaveService } from '@/backend/plans/fiches/import/import-plan-save.service';
import { ImportPlanRouter } from '@/backend/plans/fiches/import/import-plan.router';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { PlanModule } from '@/backend/plans/plans/plans.module';
import { SharedModule } from '@/backend/shared/shared.module';
import { TransactionModule } from '@/backend/utils/transaction/transaction.module';
import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [
    forwardRef(() => CollectivitesModule),
    SharedModule,
    forwardRef(() => FichesModule),
    forwardRef(() => PlanModule),
    TransactionModule,
  ],

  providers: [ImportPlanService, ImportPlanRouter, ImportPlanSaveService],
  exports: [ImportPlanService, ImportPlanRouter, ImportPlanSaveService],
})
export class ImportPlanModule {}
