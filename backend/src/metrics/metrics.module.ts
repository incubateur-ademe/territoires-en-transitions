import { IndicateursModule } from '@/backend/indicateurs/indicateurs.module';
import { MetricsRouter } from '@/backend/metrics/metrics.router';
import MetricsService from '@/backend/metrics/metrics.service';
import { FichesModule } from '@/backend/plans/fiches/fiches.module';
import { ReferentielsModule } from '@/backend/referentiels/referentiels.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [FichesModule, IndicateursModule, ReferentielsModule],
  providers: [MetricsRouter, MetricsService],
  exports: [MetricsRouter],
})
export class MetricsModule {}
