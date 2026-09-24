import { Module } from '@nestjs/common';
import { CollectivitesCoreModule } from '@tet/backend/collectivites/collectivites-core.module';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { AnalysisRouter } from './analysis.router';
import { ClassifyBatchService } from './classify-batch/classify-batch.service';
import { CollectiviteVoletGesRepository } from './collectivite-volet-ges.repository';
import { EnjeuRepositories } from './enjeu.repositories';
import { FicheActionVoletGesRepository } from './fiche-action-volet-ges.repository';
import { GetMobilisationService } from './get-mobilisation/get-mobilisation.service';
import { ScoreMobilisationService } from './score-mobilisation/score-mobilisation.service';

@Module({
  imports: [
    LlmModule,
    TransactionModule,
    FichesModule,
    CollectivitesCoreModule,
  ],
  providers: [
    ClassifyBatchService,
    AnalysisRouter,
    FicheActionVoletGesRepository,
    CollectiviteVoletGesRepository,
    EnjeuRepositories,
    ScoreMobilisationService,
    GetMobilisationService,
  ],
  exports: [AnalysisRouter],
})
export class AnalysisModule {}
