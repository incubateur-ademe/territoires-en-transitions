import { Injectable, Logger } from '@nestjs/common';
import {
  MAX_FICHE_TITLE_LENGTH,
  normalizeExtractedActions,
} from '../adapters/extracted-action-to-import-action';
import { EnqueueCompletePlanSecteursService } from '@tet/backend/plans/fiches/fiche-secteurs/complete-plan-secteurs/enqueue-complete-plan-secteurs.service';
import { ImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.input';
import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { getErrorMessage } from '@tet/domain/utils';
import {
  AI_PLAN_IMPORT_SOURCE_BUCKET,
  EVENT_AI_PLAN_IMPORT_FAILED,
  EVENT_AI_PLAN_IMPORT_SUCCEEDED,
} from '../ai-plan-import.constants';
import { type AiPlanImportError } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportJob } from '../models/ai-plan-import-job';
import { PlanDraft } from '../models/plan-draft';
import { NotifyPlanImportedService } from '../notify-plan-imported/notify-plan-imported.service';
import { countPlanContent } from './count-plan-content';
import { draftToImportPlanInput } from './draft-to-import-plan-input';
import { buildLlmOcrPage } from '../pipeline/read-document/llm-ocr-page';
import {
  readDocument,
  ReadDocumentError,
} from '../pipeline/read-document/read-document';
import { AI_PLAN_IMPORT_MAX_OCR_PAGES } from '../ai-plan-import.constants';
import {
  initialStepStates,
  PipelineError,
  runImportPipeline,
  StepName,
  StepStates,
} from '../pipeline/run-import-pipeline';

export type GenerateImportDraftError =
  | { kind: 'transition_failed'; jobId: string; cause: AiPlanImportError }
  | { kind: 'failure_record_failed'; jobId: string; cause: AiPlanImportError }
  | { kind: 'interrupted'; jobId: string; message: string };

@Injectable()
export class GenerateImportDraftService {
  private readonly logger = new Logger(GenerateImportDraftService.name);

  constructor(
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly llm: LlmService,
    private readonly importPlanService: ImportPlanService,
    private readonly planVerificationRepository: PlanVerificationRepository,
    private readonly notifyPlanImportedService: NotifyPlanImportedService,
    private readonly transactionManager: TransactionManager,
    private readonly trackingService: TrackingService,
    private readonly enqueueCompletePlanSecteursService: EnqueueCompletePlanSecteursService
  ) {}

  async generate(
    jobId: string
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const running = await this.jobRepository.transitionToRunning(jobId);
    if (!running.success) {
      return failure({
        kind: 'transition_failed',
        jobId,
        cause: running.error,
      });
    }
    const job = running.data;

    try {
      return await this.runPipeline(job);
    } catch (error) {
      const message = `Import interrompu: ${getErrorMessage(error)}`;
      await this.markFailed(jobId, message, 'interrupted');
      return failure({ kind: 'interrupted', jobId, message });
    } finally {
      await this.documentStorage.removeDocument({
        bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
        key: job.sourcePath,
      });
    }
  }

  async recordTerminalFailure(jobId: string, message: string): Promise<void> {
    const job = await this.jobRepository.getById(jobId);
    await this.markFailed(jobId, message, 'terminal_failure');
    if (job.success) {
      await this.documentStorage.removeDocument({
        bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
        key: job.data.sourcePath,
      });
    }
  }

  /**
   * `reason` part dans PostHog : un code stable, jamais le message, qui peut
   * citer le document importé (« Ce document semble être … (« extrait ») »).
   */
  private async markFailed(
    jobId: string,
    message: string,
    reason: string,
    {
      draft,
      stepStates,
      failedStep,
    }: {
      draft?: PlanDraft;
      stepStates?: StepStates;
      failedStep?: StepName;
    } = {}
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    const marked = await this.jobRepository.markFailed({
      id: jobId,
      error: message,
      stepStates: stepStates ?? initialStepStates(),
      draft,
    });
    if (marked.success) {
      if (marked.data.createdPlanId !== null) {
        // Le plan reste visible en échec : la collectivité le supprime.
        const planFailed =
          await this.planVerificationRepository.markAsImportFailed(
            marked.data.createdPlanId
          );
        if (!planFailed.success) {
          this.logger.error(
            `Import ${jobId}: plan ${marked.data.createdPlanId} non passé en échec (${planFailed.error})`
          );
        }
      }
      this.trackingService.capture({
        distinctId: marked.data.createdBy,
        event: EVENT_AI_PLAN_IMPORT_FAILED,
        properties: {
          collectiviteId: marked.data.collectiviteId,
          jobId,
          failedStep,
          reason,
          durationSeconds: secondsSince(marked.data.createdAt),
        },
      });
    }
    return marked;
  }

  private async runPipeline(
    job: AiPlanImportJob
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const source = await this.tryDownloadSource(job.sourcePath);
    if (source === null) {
      return this.recordFailure(
        job.id,
        'Document source illisible depuis le stockage',
        'source_unreadable'
      );
    }

    const ocrPage = buildLlmOcrPage(this.llm);
    const document = await readDocument(source, {
      ocr: ocrPage
        ? { ocrPage, policy: { maxOcrPages: AI_PLAN_IMPORT_MAX_OCR_PAGES } }
        : undefined,
    });
    if (!document.success) {
      return this.recordFailure(
        job.id,
        readDocumentErrorMessage(document.error),
        document.error.kind
      );
    }

    const outcome = await runImportPipeline(this.llm, {
      document: document.data,
      instructions: job.options.instructions,
      disabledFields: job.options.disabledFields,
      currentDate: new Date().toISOString(),
      withVerifications: job.options.withVerifications,
      withSousActions: job.options.withSousActions,
      onStepStatesChange: async (stepStates) => {
        await this.jobRepository.updateStepStates(job.id, stepStates);
      },
    });

    for (const warning of outcome.warnings) {
      this.logger.warn(`Import ${job.id}: ${warning}`);
    }
    if (outcome.status === 'failed') {
      return this.recordFailure(
        job.id,
        pipelineErrorMessage(outcome.failedStep, outcome.error),
        outcome.error.kind,
        { stepStates: outcome.stepStates, failedStep: outcome.failedStep }
      );
    }

    return this.persistDraftAsPlan(job, outcome.draft, outcome.stepStates);
  }

  private async persistDraftAsPlan(
    job: AiPlanImportJob,
    draft: PlanDraft,
    stepStates: StepStates
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const { actions, truncatedCount, duplicateCount } =
      normalizeExtractedActions(draft.actions);
    if (truncatedCount > 0) {
      this.logger.warn(
        `Import ${job.id}: ${truncatedCount} title(s) truncated to ${MAX_FICHE_TITLE_LENGTH} chars before plan creation`
      );
    }
    if (duplicateCount > 0) {
      this.logger.warn(
        `Import ${job.id}: ${duplicateCount} duplicate action(s) skipped before plan creation`
      );
    }

    const normalizedDraft: PlanDraft = {
      actions,
      qualitativeReview: draft.qualitativeReview,
    };
    const planInput = draftToImportPlanInput({
      actions,
      planName: job.options.planName,
      planType: job.options.planType,
    });

    const created = await this.transactionManager.executeSingle<number, string>(
      async (tx) => {
        const planId = await this.createPlan(planInput, job, tx);
        if (!planId.success) {
          return planId;
        }
        // Job lancé avant que le plan ne soit créé à l'enfilement.
        if (job.createdPlanId === null) {
          await this.planVerificationRepository.markAsImporting(
            planId.data,
            tx
          );
        }
        const marked = await this.planVerificationRepository.markAsImportedByAi(
          planId.data,
          tx
        );
        if (!marked.success) {
          return failure('Marquage du plan importé impossible');
        }
        const done = await this.jobRepository.markDone({
          id: job.id,
          draft: normalizedDraft,
          stepStates,
          createdPlanId: planId.data,
          tx,
        });
        return done.success
          ? success(planId.data)
          : failure('Enregistrement du job terminé impossible');
      }
    );

    if (!created.success) {
      return this.recordFailure(job.id, created.error, 'plan_creation_failed', {
        draft: normalizedDraft,
      });
    }

    const recap = countPlanContent(planInput);
    this.trackingService.capture({
      distinctId: job.createdBy,
      event: EVENT_AI_PLAN_IMPORT_SUCCEEDED,
      properties: {
        collectiviteId: job.collectiviteId,
        jobId: job.id,
        planId: created.data,
        ...recap,
        durationSeconds: secondsSince(job.createdAt),
      },
    });

    // Hors transaction : un envoi manqué ne défait pas le plan créé.
    await this.notifyPlanImportedService.notifyPlanImported({
      createdBy: job.createdBy,
      collectiviteId: job.collectiviteId,
      planId: created.data,
      planName: job.options.planName,
      recap,
    });
    await this.enqueueCompletePlanSecteursService.enqueue({
      planIds: [created.data],
      collectiviteId: job.collectiviteId,
      userId: job.createdBy,
    });
    return success(undefined);
  }

  private async createPlan(
    planInput: ImportPlanInput,
    job: AiPlanImportJob,
    tx: Transaction
  ): Promise<Result<number, string>> {
    try {
      const saved = await this.importPlanService.save({
        planInput,
        collectiviteId: job.collectiviteId,
        user: buildRequesterUser(job.createdBy),
        planId: job.createdPlanId ?? undefined,
        tx,
      });
      return saved.success
        ? success(saved.data.planId)
        : failure(`Création du plan impossible : ${saved.error.message}`);
    } catch (error) {
      return failure(`Création du plan impossible : ${getErrorMessage(error)}`);
    }
  }

  private async recordFailure(
    jobId: string,
    message: string,
    reason: string,
    options: {
      draft?: PlanDraft;
      stepStates?: StepStates;
      failedStep?: StepName;
    } = {}
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const marked = await this.markFailed(jobId, message, reason, options);
    return marked.success
      ? success(undefined)
      : failure({ kind: 'failure_record_failed', jobId, cause: marked.error });
  }

  private async tryDownloadSource(
    sourcePath: string
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const downloaded = await this.documentStorage.downloadDocument({
      bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
      key: sourcePath,
    });
    return downloaded.success ? downloaded.data : null;
  }
}

const readDocumentErrorMessage = (error: ReadDocumentError): string => {
  switch (error.kind) {
    case 'unsupported_mime':
      return `Type de fichier non supporté (${error.mimeType})`;
    case 'empty_text':
      return 'Document vide ou probablement scanné (aucun texte extractible)';
    case 'parse_failed':
      return 'Lecture du document impossible';
    case 'timeout':
      return 'Lecture du document trop longue';
    case 'scanned_too_long':
      return `Document scanné de ${error.scannedPages} pages : l'import en lit au plus ${error.maxOcrPages}, exportez le programme d'actions seul`;
    case 'ocr_failed':
      return `Lecture des pages scannées impossible (${
        error.failedPages.length
      } page(s) en échec : ${error.reasons.join(', ')})`;
  }
};

const secondsSince = (isoDate: string): number =>
  Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 1000));

const WRONG_TOME_LABELS: Record<string, string> = {
  evaluation_environnementale:
    'une évaluation environnementale stratégique (EES)',
  diagnostic: 'un diagnostic',
};

const pipelineErrorMessage = (
  failedStep: StepName,
  error: PipelineError
): string => {
  switch (error.kind) {
    case 'document_too_long':
      return `Document trop long pour l'import (${error.chunks} parties à analyser, ${error.maxChunks} au maximum) : importez-le en plusieurs fois`;
    case 'wrong_document_tome':
      return `Ce document semble être ${WRONG_TOME_LABELS[error.tome]} (« ${
        error.evidence
      } »), pas un programme d'actions : déposez le document qui contient les fiches actions`;
    default:
      return `Étape ${failedStep} en échec (${error.kind})`;
  }
};
