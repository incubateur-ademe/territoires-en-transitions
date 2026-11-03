import { Module } from '@nestjs/common';
import { IndicateurRepository } from './indicateur.repository';

@Module({
  providers: [IndicateurRepository],
  exports: [IndicateurRepository],
})
export class IndicateurModule {}
