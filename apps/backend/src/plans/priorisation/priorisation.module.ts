import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { AxeModule } from '../axes/axe.module';
import { FichesModule } from '../fiches/fiches.module';
import { ClassificationLeviersJobRepository } from './classification-leviers-job.repository';
import {
  CLASSIFICATION_LEVIERS_JOB_OPTIONS,
  CLASSIFICATION_LEVIERS_QUEUE_NAME,
} from './classification-leviers.queue';
import { EnqueueClassificationService } from './enqueue-classification/enqueue-classification.service';
import { FicheLeviersRepository } from './fiche-leviers.repository';
import { GenerateClassificationService } from './generate-classification/generate-classification.service';
import { GenerateClassificationWorker } from './generate-classification/generate-classification.worker';
import { GetClassificationStatusService } from './get-classification-status/get-classification-status.service';
import { PriorisationRouter } from './priorisation.router';

@Module({
  imports: [
    LlmModule,
    TransactionModule,
    AxeModule,
    FichesModule,
    BullModule.registerQueue({
      name: CLASSIFICATION_LEVIERS_QUEUE_NAME,
      defaultJobOptions: CLASSIFICATION_LEVIERS_JOB_OPTIONS,
    }),
  ],
  providers: [
    ClassificationLeviersJobRepository,
    EnqueueClassificationService,
    GenerateClassificationService,
    GenerateClassificationWorker,
    GetClassificationStatusService,
    PriorisationRouter,
    FicheLeviersRepository,
  ],
  exports: [PriorisationRouter],
})
export class PriorisationModule {}
