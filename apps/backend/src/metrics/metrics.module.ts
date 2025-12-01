import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { MetricsRouter } from '@tet/backend/metrics/metrics.router';
import MetricsService from '@tet/backend/metrics/metrics.service';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { ReferentielsModule } from '@tet/backend/referentiels/referentiels.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [FichesModule, IndicateursModule, ReferentielsModule],
  providers: [MetricsRouter, MetricsService],
  exports: [MetricsRouter],
})
export class MetricsModule {}
