import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { calculateDocumentHash } from '@tet/backend/collectivites/documents/store-document/calculate-document-hash.utils';
import { StoreDocumentService } from '@tet/backend/collectivites/documents/store-document/store-document.service';
import { UpsertPlanService } from '@tet/backend/plans/plans/upsert-plan/upsert-plan.service';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS,
  AI_PLAN_IMPORT_MAX_SOURCE_BYTES,
  AI_PLAN_IMPORT_MAX_UNCOMPRESSED_BYTES,
  AI_PLAN_IMPORT_SOURCE_BUCKET,
  EVENT_AI_PLAN_IMPORT_REFUSED,
  EVENT_AI_PLAN_IMPORT_STARTED,
} from '../ai-plan-import.constants';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from '../ai-plan-import.errors';
import {
  AI_PLAN_IMPORT_QUEUE_NAME,
  GENERATE_IMPORT_DRAFT_JOB_NAME,
  type AiPlanImportJobData,
} from '../ai-plan-import.queue';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { ValidateImportProfileService } from '../validate-import-profile/validate-import-profile.service';
import { AiPlanImportJobOptions } from '../models/ai-plan-import-job';
import {
  EnqueueImportOutput,
  enqueueImportOutputSchema,
} from './enqueue-import.output';
import {
  detectSourceMimeType,
  DOCX_MIME,
  XLSX_MIME,
} from './detect-source-mime-type';
import { validateOoxmlArchive } from './validate-ooxml-archive';

export type EnqueueImportInput = {
  collectiviteId: number;
  user: AuthenticatedUser;
  file: { buffer: Buffer; filename: string; mimeType: string; size: number };
  options: AiPlanImportJobOptions;
  /** Relance assumée de l'import d'un fichier déjà importé. */
  confirmReimport?: boolean;
};

@Injectable()
export class EnqueueImportService {
  private readonly logger = new Logger(EnqueueImportService.name);

  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly trackingService: TrackingService,
    private readonly storeDocumentService: StoreDocumentService,
    private readonly upsertPlanService: UpsertPlanService,
    private readonly planVerificationRepository: PlanVerificationRepository,
    private readonly capabilities: ValidateImportProfileService,
    @InjectQueue(AI_PLAN_IMPORT_QUEUE_NAME)
    private readonly queue: Queue<AiPlanImportJobData>
  ) {}

  async enqueue(
    input: EnqueueImportInput
  ): Promise<Result<EnqueueImportOutput, AiPlanImportError>> {
    const result = await this.enqueueJob(input);
    if (!result.success) {
      // Un refus n'a ni job ni plan : sans cet événement, il serait invisible.
      this.trackingService.capture({
        distinctId: input.user.id,
        event: EVENT_AI_PLAN_IMPORT_REFUSED,
        properties: {
          collectiviteId: input.collectiviteId,
          reason: result.error,
          declaredMimeType: input.file.mimeType,
          fileSizeBytes: input.file.size,
          planType: input.options.planType,
          origine: input.options.origine,
          demarcheId: input.options.demarcheId,
        },
        groups: { collectivite: String(input.collectiviteId) },
      });
    }
    return result;
  }

  private async enqueueJob(
    input: EnqueueImportInput
  ): Promise<Result<EnqueueImportOutput, AiPlanImportError>> {
    const { collectiviteId, user, file, options, confirmReimport } = input;

    const admission = await this.capabilities.authorizeAdmission(
      { collectiviteId, options },
      { user }
    );
    if (!admission.success) return admission;
    const { options: admittedOptions, createProvisionalPlan } = admission.data;
    const profile = admittedOptions.profile;

    if (file.size > AI_PLAN_IMPORT_MAX_SOURCE_BYTES) {
      return failure(AiPlanImportErrorEnum.FILE_TOO_LARGE);
    }

    const mimeType = detectSourceMimeType(file.buffer, file.mimeType);
    if (mimeType === null) {
      return failure(AiPlanImportErrorEnum.UNSUPPORTED_FILE_TYPE);
    }
    const sourceValidation = this.capabilities.validateSource(
      profile,
      mimeType
    );
    if (!sourceValidation.success) return sourceValidation;

    if (mimeType === XLSX_MIME || mimeType === DOCX_MIME) {
      const archive = validateOoxmlArchive(
        file.buffer,
        AI_PLAN_IMPORT_MAX_UNCOMPRESSED_BYTES
      );
      if (!archive.success) {
        return failure(
          archive.error.kind === 'not_ooxml'
            ? AiPlanImportErrorEnum.UNSUPPORTED_FILE_TYPE
            : AiPlanImportErrorEnum.FILE_TOO_LARGE
        );
      }
    }

    const inFlight = await this.jobRepository.countInFlight();
    if (!inFlight.success) {
      return inFlight;
    }
    if (inFlight.data >= AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS) {
      return failure(AiPlanImportErrorEnum.TOO_MANY_IN_FLIGHT_JOBS);
    }

    // Le super-admin importe pour plusieurs collectivités à la fois.
    const canImportInParallel = await this.permissions.isAllowed(
      user,
      'plans.fiches.import_in_parallel',
      ResourceType.PLATEFORME,
      null
    );

    if (!confirmReimport) {
      const previous = await this.jobRepository.findPreviousImport({
        collectiviteId,
        hash: calculateDocumentHash(file.buffer),
      });
      if (!previous.success) {
        return previous;
      }
      if (previous.data) {
        return failure(AiPlanImportErrorEnum.ALREADY_IMPORTED);
      }
    }

    // Rangé dans la bibliothèque, le fichier y est retrouvé par son hash au
    // prochain import ; un fichier déjà présent renvoie sa ligne existante.
    const fichier = await this.storeDocumentService.uploadBuffer(
      collectiviteId,
      {
        buffer: file.buffer,
        originalname: file.filename,
        mimetype: mimeType,
      },
      false,
      user
    );
    if (!fichier.success) {
      return failure(
        fichier.error === 'UNAUTHORIZED'
          ? AiPlanImportErrorEnum.UNAUTHORIZED
          : AiPlanImportErrorEnum.STORAGE_ERROR
      );
    }

    const sourcePath = `${collectiviteId}/${randomUUID()}`;
    const created = await this.jobRepository.createWithinQuotas(
      {
        collectiviteId,
        createdBy: user.id,
        sourcePath,
        fichierId: fichier.data.id,
        options: admittedOptions,
      },
      {
        limitUserInFlight: !canImportInParallel.success,
        createPlan: createProvisionalPlan
          ? (tx) =>
              this.createImportingPlan(
                { ...input, options: admittedOptions },
                tx
              )
          : undefined,
      }
    );
    if (!created.success) {
      return created;
    }
    const jobId = created.data.id;
    const planId = created.data.createdPlanId;

    const stored = await this.documentStorage.storeDocument({
      bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
      key: sourcePath,
      content: file.buffer,
      contentType: mimeType,
    });
    if (!stored.success) {
      await this.cleanupPendingJob(jobId, planId);
      return failure(AiPlanImportErrorEnum.STORAGE_ERROR);
    }

    try {
      await this.queue.add(
        GENERATE_IMPORT_DRAFT_JOB_NAME,
        { jobId },
        { jobId }
      );
    } catch (error) {
      this.logger.error(
        `Mise en file d'attente du job d'import ${jobId}: ${getErrorMessage(
          error
        )}`
      );
      await this.documentStorage.removeDocument({
        bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
        key: sourcePath,
      });
      await this.cleanupPendingJob(jobId, planId);
      return failure(AiPlanImportErrorEnum.CREATE_JOB_ERROR);
    }

    // Le nouvel import remplace ceux qui ont échoué : leur point de reprise
    // ne sert plus.
    const purged = await this.jobRepository.purgeFailedCheckpoints(
      collectiviteId
    );
    if (!purged.success) {
      this.logger.warn(
        `Points de reprise de la collectivité ${collectiviteId} non purgés (${purged.error})`
      );
    }

    this.trackingService.capture({
      distinctId: user.id,
      event: EVENT_AI_PLAN_IMPORT_STARTED,
      properties: {
        collectiviteId,
        jobId,
        mimeType,
        fileSizeBytes: file.size,
        planType: created.data.options.planType,
        withVerifications: options.withVerifications,
        withSousActions: options.withSousActions,
        withSecteurs: admittedOptions.withSecteurs,
        profile,
        origine: options.origine,
        demarcheId: options.demarcheId,
        schemaVersion: created.data.options.schemaVersion,
        catalogueVersion: created.data.options.catalogueVersion ?? undefined,
      },
      groups: { collectivite: String(collectiviteId) },
    });
    return success(enqueueImportOutputSchema.parse({ profile, jobId, planId }));
  }

  /**
   * Le plan existe dès le lancement, vide et en cours d'import : il apparaît
   * aussitôt dans les listes, sans qu'on puisse l'ouvrir avant la fin du job.
   */
  private async createImportingPlan(
    { collectiviteId, user, options }: EnqueueImportInput,
    tx: Transaction
  ): Promise<Result<number, AiPlanImportError>> {
    const plan = await this.upsertPlanService.upsertPlan(
      { collectiviteId, nom: options.planName, typeId: options.planType },
      { user, tx }
    );
    if (!plan.success) {
      return failure(
        plan.error === 'UNAUTHORIZED'
          ? AiPlanImportErrorEnum.UNAUTHORIZED
          : AiPlanImportErrorEnum.CREATE_PLAN_ERROR
      );
    }

    const importing = await this.planVerificationRepository.markAsImporting(
      plan.data.id,
      tx
    );
    return importing.success
      ? success(plan.data.id)
      : failure(AiPlanImportErrorEnum.CREATE_PLAN_ERROR);
  }

  private async cleanupPendingJob(
    jobId: string,
    planId: number | null
  ): Promise<void> {
    const cleanup = await this.jobRepository.deleteIfPending(jobId);
    if (!cleanup.success) {
      this.logger.error(
        `Nettoyage de la ligne pending ${jobId} après échec de mise en file d'attente: ${cleanup.error} — la collectivité reste bloquée jusqu'à intervention`
      );
    }
    if (planId === null) return;
    const planCleanup =
      await this.planVerificationRepository.deleteImportingPlan(planId);
    if (!planCleanup.success) {
      this.logger.error(
        `Nettoyage du plan ${planId} du job ${jobId} jamais démarré: ${planCleanup.error}`
      );
    }
  }
}
