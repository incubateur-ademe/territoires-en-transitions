import { Module } from '@nestjs/common';
import { CollectivitesCoreModule } from '@tet/backend/collectivites/collectivites-core.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { CollectiviteLevierGesPertinenceRepository } from './collectivite-levier-ges-pertinence.repository';
import { EnjeuPertinencesRepositories } from './enjeu-pertinences.repositories';
import { ListPertinencesLeviersService } from './list-pertinences-leviers/list-pertinences-leviers.service';
import { PertinenceLeviersRouter } from './pertinence-leviers.router';
import { UpsertPertinenceLevierService } from './upsert-pertinence-levier/upsert-pertinence-levier.service';

@Module({
  imports: [TransactionModule, CollectivitesCoreModule],
  providers: [
    CollectiviteLevierGesPertinenceRepository,
    EnjeuPertinencesRepositories,
    ListPertinencesLeviersService,
    UpsertPertinenceLevierService,
    PertinenceLeviersRouter,
  ],
  exports: [PertinenceLeviersRouter],
})
export class PertinenceLeviersModule {}
