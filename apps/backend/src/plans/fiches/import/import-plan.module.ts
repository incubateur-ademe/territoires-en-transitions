import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { ImportPlanRouter } from '@tet/backend/plans/fiches/import/import-plan.router';
import { ImportPlanService } from '@tet/backend/plans/fiches/import/import-plan.service';
import { EntityResolverService } from '@tet/backend/plans/fiches/import/resolvers/entity-resolver.service';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';
import { SharedModule } from '@tet/backend/shared/shared.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';

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
    EntityResolverService,
  ],
  exports: [ImportPlanService, ImportPlanRouter],
})
export class ImportPlanModule {}
