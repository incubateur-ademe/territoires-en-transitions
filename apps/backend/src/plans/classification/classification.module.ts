import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { FichesModule } from '../fiches/fiches.module';
import { ClassificationVoletsJobRepository } from './classification-volets-job.repository';
import {
  ANALYSIS_FLOW_PRODUCER_NAME,
  CLASSIFICATION_VOLETS_JOB_OPTIONS,
  CLASSIFICATION_VOLETS_QUEUE_NAME,
} from './classification-volets.queue';
import {
  CLASSIFY_BATCH_JOB_OPTIONS,
  CLASSIFY_BATCH_QUEUE_NAME,
} from './classify-batch/classify-batch.queue';
import { ClassifyBatchService } from './classify-batch/classify-batch.service';
import { ClassifyBatchWorker } from './classify-batch/classify-batch.worker';
import { EnqueueAnalysisService } from './enqueue-analysis/enqueue-analysis.service';
import { FicheActionVoletGesRepository } from './fiche-action-volet-ges.repository';
import { GenerateAnalysisService } from './generate-analysis/generate-analysis.service';
import { GenerateClassificationService } from './generate-classification/generate-classification.service';
import { GenerateClassificationWorker } from './generate-classification/generate-classification.worker';
import { GetAnalysisStatusService } from './get-analysis-status/get-analysis-status.service';
import { ClassificationRouter } from './classification.router';
import { CollectivitesCoreModule } from '@tet/backend/collectivites/collectivites-core.module';
import { CollectiviteVoletGesRepository } from './collectivite-volet-ges.repository';
import { GenerateMobilisationService } from './generate-mobilisation/generate-mobilisation.service';
import { GetMobilisationService } from './get-mobilisation/get-mobilisation.service';

@Module({
  imports: [
    LlmModule,
    TransactionModule,
    FichesModule,
    CollectivitesCoreModule,
    BullModule.registerQueue({
      name: CLASSIFICATION_VOLETS_QUEUE_NAME,
      defaultJobOptions: CLASSIFICATION_VOLETS_JOB_OPTIONS,
    }),
    BullModule.registerQueue({
      name: CLASSIFY_BATCH_QUEUE_NAME,
      defaultJobOptions: CLASSIFY_BATCH_JOB_OPTIONS,
    }),
    BullModule.registerFlowProducer({ name: ANALYSIS_FLOW_PRODUCER_NAME }),
  ],
  providers: [
    ClassificationVoletsJobRepository,
    EnqueueAnalysisService,
    ClassifyBatchService,
    ClassifyBatchWorker,
    GenerateAnalysisService,
    GenerateClassificationService,
    GenerateClassificationWorker,
    GetAnalysisStatusService,
    ClassificationRouter,
    FicheActionVoletGesRepository,
    CollectiviteVoletGesRepository,
    GenerateMobilisationService,
    GetMobilisationService,
  ],
  exports: [ClassificationRouter],
})
export class ClassificationModule {}
