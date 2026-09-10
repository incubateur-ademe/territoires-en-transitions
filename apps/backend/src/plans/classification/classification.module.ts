import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { AxeModule } from '../axes/axe.module';
import { FichesModule } from '../fiches/fiches.module';
import { ClassificationVoletsJobRepository } from './classification-volets-job.repository';
import {
  CLASSIFICATION_VOLETS_JOB_OPTIONS,
  CLASSIFICATION_VOLETS_QUEUE_NAME,
} from './classification-volets.queue';
import { EnqueueClassificationService } from './enqueue-classification/enqueue-classification.service';
import { FicheActionVoletGesRepository } from './fiche-action-volet-ges.repository';
import { GenerateClassificationService } from './generate-classification/generate-classification.service';
import { GenerateClassificationWorker } from './generate-classification/generate-classification.worker';
import { GetClassificationStatusService } from './get-classification-status/get-classification-status.service';
import { ClassificationRouter } from './classification.router';

@Module({
  imports: [
    LlmModule,
    TransactionModule,
    AxeModule,
    FichesModule,
    BullModule.registerQueue({
      name: CLASSIFICATION_VOLETS_QUEUE_NAME,
      defaultJobOptions: CLASSIFICATION_VOLETS_JOB_OPTIONS,
    }),
  ],
  providers: [
    ClassificationVoletsJobRepository,
    EnqueueClassificationService,
    GenerateClassificationService,
    GenerateClassificationWorker,
    GetClassificationStatusService,
    ClassificationRouter,
    FicheActionVoletGesRepository,
  ],
  exports: [ClassificationRouter],
})
export class ClassificationModule {}
