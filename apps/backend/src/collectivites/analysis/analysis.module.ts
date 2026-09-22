import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { AnalysisJobRepository } from './analysis-job.repository';
import {
  ANALYSIS_FLOW_PRODUCER_NAME,
  ANALYSIS_JOB_OPTIONS,
  ANALYSIS_QUEUE_NAME,
} from './analysis.queue';
import {
  CLASSIFY_BATCH_JOB_OPTIONS,
  CLASSIFY_BATCH_QUEUE_NAME,
} from './classify-batch/classify-batch.queue';
import { ClassifyBatchService } from './classify-batch/classify-batch.service';
import { ClassifyBatchWorker } from './classify-batch/classify-batch.worker';
import { EnjeuRepositories } from './enjeu.repositories';
import { EnqueueAnalysisService } from './enqueue-analysis/enqueue-analysis.service';
import { FicheActionVoletGesRepository } from './fiche-action-volet-ges.repository';
import { GenerateAnalysisService } from './generate-analysis/generate-analysis.service';
import { PersistClassificationService } from './persist-classification/persist-classification.service';
import { GenerateAnalysisWorker } from './generate-analysis/generate-analysis.worker';
import { GetLastAnalysisService } from './get-last-analysis/get-last-analysis.service';
import { AnalysisRouter } from './analysis.router';
import { CollectivitesCoreModule } from '@tet/backend/collectivites/collectivites-core.module';
import { CollectiviteVoletGesRepository } from './collectivite-volet-ges.repository';
import { PersistMobilisationService } from './persist-mobilisation/persist-mobilisation.service';
import { ScoreMobilisationService } from './score-mobilisation/score-mobilisation.service';
import { GetMobilisationService } from './get-mobilisation/get-mobilisation.service';

@Module({
  imports: [
    LlmModule,
    TransactionModule,
    FichesModule,
    CollectivitesCoreModule,
    BullModule.registerQueue({
      name: ANALYSIS_QUEUE_NAME,
      defaultJobOptions: ANALYSIS_JOB_OPTIONS,
    }),
    BullModule.registerQueue({
      name: CLASSIFY_BATCH_QUEUE_NAME,
      defaultJobOptions: CLASSIFY_BATCH_JOB_OPTIONS,
    }),
    BullModule.registerFlowProducer({ name: ANALYSIS_FLOW_PRODUCER_NAME }),
  ],
  providers: [
    AnalysisJobRepository,
    EnqueueAnalysisService,
    ClassifyBatchService,
    ClassifyBatchWorker,
    GenerateAnalysisService,
    PersistClassificationService,
    GenerateAnalysisWorker,
    GetLastAnalysisService,
    AnalysisRouter,
    FicheActionVoletGesRepository,
    CollectiviteVoletGesRepository,
    EnjeuRepositories,
    ScoreMobilisationService,
    PersistMobilisationService,
    GetMobilisationService,
  ],
  exports: [AnalysisRouter],
})
export class AnalysisModule {}
