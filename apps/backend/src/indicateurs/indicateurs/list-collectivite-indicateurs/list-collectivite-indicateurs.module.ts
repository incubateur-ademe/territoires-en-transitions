import { Module } from '@nestjs/common';
import { ListCollectiviteIndicateursRepository } from './list-collectivite-indicateurs.repository';

@Module({
  providers: [ListCollectiviteIndicateursRepository],
  exports: [ListCollectiviteIndicateursRepository],
})
export class ListCollectiviteIndicateursModule {}
