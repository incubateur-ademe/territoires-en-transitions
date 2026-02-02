import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { ResolveEntityService } from '@tet/backend/plans/plans/import-plan-aggregate/resolvers/resolve-entity.service';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';
import { SharedModule } from '@tet/backend/shared/shared.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { ImportPlanApplicationService } from './import-plan.application-service';
import { ImportPlanRouter } from './import-plan.router';

@Module({
  imports: [
    forwardRef(() => CollectivitesModule),
    SharedModule,
    forwardRef(() => FichesModule),
    forwardRef(() => PlanModule),
    TransactionModule,
  ],

  providers: [
    ImportPlanApplicationService,
    ImportPlanRouter,
    ResolveEntityService,
  ],
  exports: [ImportPlanRouter],
})
export class ImportPlanModule {}
