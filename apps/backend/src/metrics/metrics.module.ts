import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { CollectivitesMetricsRouter } from '@tet/backend/metrics/collectivites/collectivites-metrics.router';
import { CollectivitesMetricsService } from '@tet/backend/metrics/collectivites/collectivites-metrics.service';
import { CollectivitesModulesService } from '@tet/backend/metrics/collectivites/collectivites-modules.service';
import { MetricsRouter } from '@tet/backend/metrics/metrics.router';
import { UsersMetricsRouter } from '@tet/backend/metrics/users/users-metrics.router';
import { UsersMetricsService } from '@tet/backend/metrics/users/users-metrics.service';
import { UsersModulesService } from '@tet/backend/metrics/users/users-modules.service';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';
import { ReferentielsModule } from '@tet/backend/referentiels/referentiels.module';
import { Module, forwardRef } from '@nestjs/common';

@Module({
  imports: [
    FichesModule,
    IndicateursModule,
    ReferentielsModule,
    forwardRef(() => PlanModule),
  ],
  providers: [
    MetricsRouter,
    CollectivitesMetricsRouter,
    CollectivitesMetricsService,
    CollectivitesModulesService,
    UsersMetricsRouter,
    UsersMetricsService,
    UsersModulesService,
  ],
  exports: [MetricsRouter],
})
export class MetricsModule {}
