import { Module } from '@nestjs/common';
import { ListCollectiviteIndicateursRepository } from '../definitions/list-collectivite-indicateurs/list-collectivite-indicateurs.repository';

@Module({
  providers: [ListCollectiviteIndicateursRepository],
  exports: [ListCollectiviteIndicateursRepository],
})
export class IndicateurModule {}
