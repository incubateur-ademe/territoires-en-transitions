import { EstimateLevierGesController } from '@tet/backend/planet/estimate-levier-ges.controller';
import { EstimateLevierGesService } from '@tet/backend/planet/estimate-levier-ges.service';
import { leviersGesEstimatorProvider } from '@tet/backend/planet/leviers-ges-estimator.provider';
import { Module } from '@nestjs/common';

/**
 * Implémentation de la méthodologie PlanET de l'ADEME (tableur PlanET V1),
 * fournie par le paquet `leviers-ges`.
 */
@Module({
  providers: [leviersGesEstimatorProvider, EstimateLevierGesService],
  controllers: [EstimateLevierGesController],
})
export class PlanetModule {}
