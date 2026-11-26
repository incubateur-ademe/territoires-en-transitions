import { Module } from '@nestjs/common';
import { EstimateLevierGesController } from './estimate-levier-ges.controller';
import { EstimateLevierGesService } from './estimate-levier-ges.service';
import { leviersGesEstimatorProvider } from './leviers-ges-estimator.provider';
import { leviersGesSolverProvider } from './leviers-ges-solver.provider';
import { SolveLevierGesController } from './solve-levier-ges.controller';
import { SolveLevierGesService } from './solve-levier-ges.service';

@Module({
  providers: [
    leviersGesEstimatorProvider,
    leviersGesSolverProvider,
    EstimateLevierGesService,
    SolveLevierGesService,
  ],
  controllers: [EstimateLevierGesController, SolveLevierGesController],
})
export class PlanetModule {}
