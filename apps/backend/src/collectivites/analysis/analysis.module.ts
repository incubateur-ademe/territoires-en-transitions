import { Module } from '@nestjs/common';
import { CollectivitesCoreModule } from '@tet/backend/collectivites/collectivites-core.module';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { AnalysisRouter } from './analysis.router';
import { CollectiviteVoletGesRepository } from './collectivite-volet-ges.repository';
import { EnjeuRepositories } from './enjeu.repositories';
import { FicheActionVoletGesRepository } from './fiche-action-volet-ges.repository';
import { GetMobilisationService } from './get-mobilisation/get-mobilisation.service';

@Module({
  imports: [TransactionModule, FichesModule, CollectivitesCoreModule],
  providers: [
    AnalysisRouter,
    FicheActionVoletGesRepository,
    CollectiviteVoletGesRepository,
    EnjeuRepositories,
    GetMobilisationService,
  ],
  exports: [AnalysisRouter],
})
export class AnalysisModule {}
