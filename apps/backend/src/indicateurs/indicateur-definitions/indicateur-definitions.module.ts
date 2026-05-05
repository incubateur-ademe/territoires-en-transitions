import { Module } from '@nestjs/common';
import { IndicateurDefinitionsRepository } from './indicateur-definitions.repository';

@Module({
  providers: [IndicateurDefinitionsRepository],
  exports: [IndicateurDefinitionsRepository],
})
export class IndicateurDefinitionsModule {}
