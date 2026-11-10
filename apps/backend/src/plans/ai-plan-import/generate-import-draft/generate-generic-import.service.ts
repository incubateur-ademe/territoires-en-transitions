import { Injectable, Logger } from '@nestjs/common';
import { ImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.input';
import { ImportErrors } from '@tet/backend/plans/plans/import-plan-aggregate/import.errors';
import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { EffetAttenduService } from '@tet/backend/shared/effet-attendu/effet-attendu.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success, Result } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import {
  isFailedResult,
  TransactionManager,
} from '@tet/backend/utils/transaction/transaction-manager.service';
import { getErrorMessage } from '@tet/domain/utils';
import {
  MAX_FICHE_TITLE_LENGTH,
  normalizeExtractedActions,
} from '../adapters/extracted-action-to-import-action';
import {
  AI_PLAN_IMPORT_SOURCE_BUCKET,
  AI_PLAN_IMPORT_MAX_OCR_PAGES,
} from '../ai-plan-import.constants';
import { aiPlanImportJobErrorMessages } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportJob } from '../models/ai-plan-import-job';
import { ImportCheckpoint } from '../models/import-checkpoint';
import { PlanDraft } from '../models/plan-draft';
import { computeContentMetrics } from '../pipeline/compute-import-metrics';
import { ReadDocument } from '../pipeline/document/document-page';
import { buildLlmOcrPage } from '../pipeline/read-document/llm-ocr-page';
import { readDocument } from '../pipeline/read-document/read-document';
import {
  isCheckpointUsableBy,
  runImportPipeline,
  StepStates,
} from '../pipeline/run-import-pipeline';
import { CompletePlanImportService } from './complete-plan-import.service';
import { countPlanContent } from './count-plan-content';
import { draftToImportPlanInput } from './draft-to-import-plan-input';
import {
  GeneratedImport,
  ImportFailureOptions,
  ImportGenerationFailure,
  ImportGenerator,
} from './generate-import.types';
import { ImportGenerationErrors } from './generate-import.errors';
import { ImportJobTelemetry } from './import-job-telemetry';

/** Extrait et persiste les plans libres, y compris les plans PCAET. */
@Injectable()
export class GenerateGenericImportService implements ImportGenerator {
  private readonly logger = new Logger(GenerateGenericImportService.name);

  constructor(
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly llm: LlmService,
    private readonly importPlanService: ImportPlanService,
    private readonly transactionManager: TransactionManager,
    private readonly effetAttenduService: EffetAttenduService,
    private readonly completion: CompletePlanImportService
  ) {}

  async generate(
    job: AiPlanImportJob,
    checkpoint: ImportCheckpoint | null,
    telemetry: ImportJobTelemetry
  ): Promise<Result<GeneratedImport, ImportGenerationFailure>> {
    const { attempt } = job;
    const usable =
      checkpoint && isCheckpointUsableBy(checkpoint, this.llm)
        ? checkpoint
        : null;

    let start:
      | { document: ReadDocument; currentDate: string }
      | { resumeFrom: ImportCheckpoint; currentDate: string };
    if (usable) {
      this.logger.log(
        `Import ${job.id}: reprise après l'étape ${usable.completedStep}`
      );
      telemetry.restoreDocument(usable.documentStats);
      start = {
        resumeFrom: {
          ...usable,
          documentKind: usable.documentKind ?? usable.documentStats?.kind,
        },
        currentDate: usable.currentDate,
      };
    } else {
      const source = await this.tryDownloadSource(job.sourcePath);
      if (source === null) {
        // Le document est supprimé dès le premier échec : un point de reprise
        // d'un autre format ou d'un autre modèle ne peut plus servir.
        return checkpoint
          ? this.failed(
              aiPlanImportJobErrorMessages.CHECKPOINT_UNUSABLE,
              'checkpoint_unusable',
              { attempt, dropCheckpoint: true }
            )
          : this.failed(
              aiPlanImportJobErrorMessages.SOURCE_UNREADABLE,
              'source_unreadable',
              { attempt }
            );
      }
      if (checkpoint) {
        this.logger.warn(
          `Import ${job.id}: point de reprise inutilisable par le modèle configuré, reprise du document`
        );
      }

      const ocrPage = buildLlmOcrPage(this.llm);
      const document = await telemetry.measureDocument(() =>
        readDocument(source, {
          ocr: ocrPage
            ? {
                ocrPage,
                policy: { maxOcrPages: AI_PLAN_IMPORT_MAX_OCR_PAGES },
              }
            : undefined,
        })
      );
      if (!document.success) {
        return this.failed(
          ImportGenerationErrors.fromDocument(document.error),
          document.error.kind,
          { attempt, stats: telemetry.stats() }
        );
      }
      telemetry.setDocument(source, document.data);
      start = {
        document: document.data,
        currentDate: new Date().toISOString(),
      };
    }

    const effetsAttendus = await this.effetAttenduService.getEffetAttendu();
    const outcome = await runImportPipeline(this.llm, {
      ...start,
      instructions: job.options.instructions,
      disabledFields: job.options.disabledFields,
      withVerifications: job.options.withVerifications,
      withSousActions: job.options.withSousActions,
      withSecteurs: job.options.withSecteurs ?? false,
      effetsAttendus,
      onStepStatesChange: async (stepStates) => {
        await this.jobRepository.updateStepStates(job.id, attempt, stepStates);
      },
      onStepRun: (run) => telemetry.record(run),
      onCheckpoint: async (pipelineCheckpoint) => {
        const saved = await this.jobRepository.saveCheckpoint(job.id, attempt, {
          ...pipelineCheckpoint,
          documentStats: telemetry.documentStats(),
        });
        if (!saved.success) {
          // L'import continue, mais ne pourra pas reprendre à cette étape.
          this.logger.error(
            `Import ${job.id}: point de reprise après ${pipelineCheckpoint.completedStep} non enregistré (${saved.error})`
          );
        }
      },
    });
    telemetry.addWarnings(outcome.warnings.length);

    for (const warning of outcome.warnings) {
      this.logger.warn(`Import ${job.id}: ${warning}`);
    }
    if (outcome.status === 'failed') {
      return this.failed(
        ImportGenerationErrors.fromPipeline(outcome.failedStep, outcome.error),
        outcome.error.kind,
        {
          attempt,
          stepStates: outcome.stepStates,
          failedStep: outcome.failedStep,
          stats: telemetry.stats(),
        }
      );
    }

    return this.persistDraftAsPlan(
      job,
      outcome.draft,
      outcome.stepStates,
      telemetry
    );
  }

  private async persistDraftAsPlan(
    job: AiPlanImportJob,
    draft: PlanDraft,
    stepStates: StepStates,
    telemetry: ImportJobTelemetry
  ): Promise<Result<GeneratedImport, ImportGenerationFailure>> {
    const {
      actions,
      truncatedCount,
      duplicateCount,
      removedDescriptionLines,
      removedObjectifSousActions,
    } = normalizeExtractedActions(draft.actions);
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
    if (removedDescriptionLines > 0 || removedObjectifSousActions > 0) {
      this.logger.warn(
        `Import ${job.id}: ${removedDescriptionLines} description line(s) and ${removedObjectifSousActions} sous-action(s) repeating another field removed before plan creation`
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

    telemetry.setContent({
      ...computeContentMetrics(actions),
      extracted: draft.actions.length,
      duplicates: duplicateCount,
      truncatedTitles: truncatedCount,
      removedDescriptionLines,
      removedObjectifSousActions,
      scored: actions.filter((action) => action.confidence !== null).length,
      improved: actions.filter((action) => action.confidence?.amelioree).length,
      fichesCreated: planInput.actions.length,
      hasQualitativeReview: draft.qualitativeReview !== null,
    });
    const stats = telemetry.stats();

    const persist = () =>
      this.transactionManager.executeSingle<number, string>(async (tx) => {
        const planId = await this.createPlan(planInput, job, tx);
        if (!planId.success) {
          return planId;
        }
        return this.completion.complete(
          {
            job,
            planId: planId.data,
            draft: normalizedDraft,
            stepStates,
            stats,
          },
          tx
        );
      });
    const created = await telemetry.measure('persistence', persist, (result) =>
      result.success
        ? { status: 'ok', details: { fichesCreated: planInput.actions.length } }
        : { status: 'failed', error: 'plan_creation_failed' }
    );

    if (!created.success) {
      return this.failed(created.error, 'plan_creation_failed', {
        attempt: job.attempt,
        draft: normalizedDraft,
        stats,
      });
    }

    return success({
      planId: created.data,
      recap: countPlanContent(planInput),
      stats,
    });
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
        : this.planCreationFailed(job.id, saved.error, saved.cause);
    } catch (error) {
      // Avec `tx` partagé, le TransactionManager relance son échec en
      // exception : un Result, sans `message`.
      return isFailedResult<ImportErrors>(error)
        ? this.planCreationFailed(job.id, error.error, error.cause)
        : this.planCreationFailed(job.id, null, error);
    }
  }

  /**
   * Le message du job est montré à l'utilisateur : il reste métier. La cause
   * technique, noms de tables et de contraintes compris, ne va qu'aux journaux.
   */
  private planCreationFailed(
    jobId: string,
    error: ImportErrors | null,
    cause: unknown
  ): Result<never, string> {
    const message = ImportGenerationErrors.planCreation(error);
    this.logger.error(
      `Import ${jobId}: ${message} (${getErrorMessage(
        rootCause(cause ?? error)
      )})`
    );
    return failure(message);
  }

  private failed(
    message: string,
    reason: string,
    options: ImportFailureOptions = {}
  ): Result<never, ImportGenerationFailure> {
    return failure({ message, reason, ...options });
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

/** Sous une erreur Drizzle, qui cite la requête, l'erreur Postgres. */
const rootCause = (error: unknown): unknown => {
  let current = error;
  while (current instanceof Error && current.cause instanceof Error) {
    current = current.cause;
  }
  return current;
};
