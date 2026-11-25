import { Module } from '@nestjs/common';
import { EstimateLevierGesController } from './estimate-levier-ges.controller';
import { EstimateLevierGesService } from './estimate-levier-ges.service';
import { leviersGesEstimatorProvider } from './leviers-ges-estimator.provider';

@Module({
  providers: [leviersGesEstimatorProvider, EstimateLevierGesService],
  controllers: [EstimateLevierGesController],
})
export class PlanetModule {}
