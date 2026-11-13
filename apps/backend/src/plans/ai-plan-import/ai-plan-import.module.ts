import { PrepareElectrificationImportService } from './electrification/extract-plan/prepare-electrification-import.service';
import { PersistElectrificationImportService } from './electrification/persist-import/persist-electrification-import.service';
import { GenerateElectrificationImportService } from './electrification/generate-import/generate-electrification-import.service';
import { ValidateElectrificationImportService } from './electrification/validate-import/validate-electrification-import.service';
import { ResolveElectrificationFichesService } from './electrification/resolve-fiches/resolve-electrification-fiches.service';
import { ResolveElectrificationIndicateursService } from './electrification/resolve-fiches/resolve-electrification-indicateurs.service';
import { FichesModule } from '../fiches/fiches.module';
import { ResolveImportReferenceService } from './resolve-import-reference/resolve-import-reference.service';
import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { SharedModule } from '@tet/backend/shared/shared.module';
import { UsersModule } from '@tet/backend/users/users.module';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';
import { NotificationsModule } from '@tet/backend/utils/notifications/notifications.module';
import { TrackingModule } from '@tet/backend/utils/tracking/tracking.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { ElectrificationDataModule } from '../plans/electrification/publish-electrification-data/electrification-data.module';
import { CompletePlanSecteursModule } from '../fiches/fiche-secteurs/complete-plan-secteurs/complete-plan-secteurs.module';
import { PlanModule } from '../plans/plans.module';
import { PlansUtilsModule } from '../utils/plans-utils.module';
import { AiPlanImportJobRepository } from './ai-plan-import-job.repository';
import { AiPlanImportStepRunRepository } from './ai-plan-import-step-run.repository';
import {
  AI_PLAN_IMPORT_JOB_OPTIONS,
  AI_PLAN_IMPORT_QUEUE_NAME,
} from './ai-plan-import.queue';
import { EnqueueImportController } from './enqueue-import/enqueue-import.controller';
import { EnqueueImportService } from './enqueue-import/enqueue-import.service';
import { GenerateImportDraftService } from './generate-import-draft/generate-import-draft.service';
import { GenerateGenericImportService } from './generate-import-draft/generate-generic-import.service';
import { CompletePlanImportService } from './generate-import-draft/complete-plan-import.service';
import { GenerateImportDraftWorker } from './generate-import-draft/generate-import-draft.worker';
import { FindPreviousImportRouter } from './find-previous-import/find-previous-import.router';
import { FindPreviousImportService } from './find-previous-import/find-previous-import.service';
import { GetImportStatusRouter } from './get-import-status/get-import-status.router';
import { GetImportStatusService } from './get-import-status/get-import-status.service';
import { GetImportCapabilitiesRouter } from './get-import-capabilities/get-import-capabilities.router';
import { ValidateImportProfileService } from './validate-import-profile/validate-import-profile.service';
import { NotifyPlanImportedService } from './notify-plan-imported/notify-plan-imported.service';
import { ResumeImportRouter } from './resume-import/resume-import.router';
import { ResolveElectrificationEngagementsService } from './electrification/resolve-engagements/resolve-electrification-engagements.service';
import { ResumeImportService } from './resume-import/resume-import.service';

@Module({
  imports: [
    forwardRef(() => FichesModule),
    LlmModule,
    TransactionModule,
    PlanModule,
    ElectrificationDataModule,
    forwardRef(() => CollectivitesModule),
    CompletePlanSecteursModule,
    PlansUtilsModule,
    SharedModule,
    UsersModule,
    IndicateursModule,
    NotificationsModule,
    TrackingModule,
    BullModule.registerQueue({
      name: AI_PLAN_IMPORT_QUEUE_NAME,
      defaultJobOptions: AI_PLAN_IMPORT_JOB_OPTIONS,
    }),
  ],
  controllers: [EnqueueImportController],
  providers: [
    ResolveElectrificationEngagementsService,
    PrepareElectrificationImportService,
    PersistElectrificationImportService,
    GenerateElectrificationImportService,
    ValidateElectrificationImportService,
    ResolveElectrificationFichesService,
    ResolveElectrificationIndicateursService,
    ResolveImportReferenceService,
    AiPlanImportJobRepository,
    AiPlanImportStepRunRepository,
    EnqueueImportService,
    GenerateImportDraftService,
    GenerateGenericImportService,
    CompletePlanImportService,
    GenerateImportDraftWorker,
    GetImportStatusService,
    GetImportStatusRouter,
    ValidateImportProfileService,
    GetImportCapabilitiesRouter,
    FindPreviousImportService,
    FindPreviousImportRouter,
    NotifyPlanImportedService,
    ResumeImportService,
    ResumeImportRouter,
  ],
  exports: [
    GetImportStatusRouter,
    GetImportCapabilitiesRouter,
    FindPreviousImportRouter,
    ResumeImportRouter,
  ],
})
export class AiPlanImportModule {}
