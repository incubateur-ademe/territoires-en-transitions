import { CollectivitesModule } from '@/backend/collectivites/collectivites.module';
import { FichesModule } from '@/backend/plans/fiches/fiches.module';
import { ImportPlanRouter } from '@/backend/plans/fiches/import/import-plan.router';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { EntityResolverService } from '@/backend/plans/fiches/import/resolvers/entity-resolver.service';
import { PlanAggregateService } from '@/backend/plans/plans/domain/plan-aggregate.service';
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

  providers: [
    ImportPlanService,
    ImportPlanRouter,
    PlanAggregateService,
    EntityResolverService,
  ],
  exports: [ImportPlanService, ImportPlanRouter],
})
export class ImportPlanModule {}
