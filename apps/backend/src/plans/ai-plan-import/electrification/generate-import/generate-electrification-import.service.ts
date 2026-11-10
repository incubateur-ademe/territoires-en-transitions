import { Injectable, Logger } from '@nestjs/common';
import { electrificationImportStepStates } from '@tet/backend/plans/plans/electrification/config/electrification-import.config';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { AI_PLAN_IMPORT_SOURCE_BUCKET } from '../../ai-plan-import.constants';
import { AiPlanImportJobRepository } from '../../ai-plan-import-job.repository';
import {
  aiPlanImportErrorMessages,
  aiPlanImportJobErrorMessages,
} from '../../ai-plan-import.errors';
import { ImportJobTelemetry } from '../../generate-import-draft/import-job-telemetry';
import { ValidateElectrificationImportService } from '../validate-import/validate-electrification-import.service';
import { AiPlanImportJob } from '../../models/ai-plan-import-job';
import {
  GeneratedImport,
  ImportGenerationFailure,
  ImportGenerator,
} from '../../generate-import-draft/generate-import.types';
import { CompletePlanImportService } from '../../generate-import-draft/complete-plan-import.service';
import { StoredImportCheckpoint } from '../../models/import-checkpoint';
import { AiPlanImportProfileEnum } from '../../models/import-profile';
import { readDocument } from '../../pipeline/read-document/read-document';
import { StepStates } from '../../pipeline/run-import-pipeline';
import { ElectrificationExtractionCheckpoint } from '../extract-plan/electrification-extraction-checkpoint.schema';
import { ElectrificationExtractionErrors } from '../extract-plan/electrification-extraction.errors';
import { PrepareElectrificationImportService } from '../extract-plan/prepare-electrification-import.service';
import { ElectrificationPersistenceErrors } from '../persist-import/electrification-persistence.errors';
import { PersistElectrificationImportService } from '../persist-import/persist-electrification-import.service';
import { ElectrificationIssue } from '../electrification-issue';

/** Le profil prépare son document ; le cycle de vie et les effets restent communs. */
@Injectable()
export class GenerateElectrificationImportService implements ImportGenerator {
  private readonly logger = new Logger(
    GenerateElectrificationImportService.name
  );
  constructor(
    private readonly jobs: AiPlanImportJobRepository,
    private readonly storage: DocumentStorageService,
    private readonly preparation: PrepareElectrificationImportService,
    private readonly persistence: PersistElectrificationImportService,
    private readonly verification: PlanVerificationRepository,
    private readonly transactions: TransactionManager,
    private readonly authorization: ValidateElectrificationImportService,
    private readonly completion: CompletePlanImportService
  ) {}

  async generate(
    job: AiPlanImportJob,
    checkpoint: StoredImportCheckpoint | null,
    telemetry: ImportJobTelemetry
  ): Promise<Result<GeneratedImport, ImportGenerationFailure>> {
    if (
      checkpoint &&
      checkpoint.profile !== AiPlanImportProfileEnum.ELECTRIFICATION
    ) {
      return failure({
        message: aiPlanImportErrorMessages.INVALID_CHECKPOINT,
        reason: 'checkpoint_unsupported',
      });
    }
    const imported = await this.generatePlan(job, checkpoint, telemetry);
    return imported.success
      ? imported
      : failure({
          message:
            imported.error[0]?.message ??
            aiPlanImportJobErrorMessages.IMPORT_FAILED,
          reason: imported.error[0]?.code ?? 'electrification_failed',
          stats: telemetry.stats(),
          report: { issues: imported.error, qualitativeReview: null },
        });
  }

  private async generatePlan(
    job: AiPlanImportJob,
    checkpoint: ElectrificationExtractionCheckpoint | null,
    telemetry: ImportJobTelemetry
  ): Promise<Result<GeneratedImport, ElectrificationIssue[]>> {
    const stepStates: StepStates = { ...electrificationImportStepStates };
    const initialized = await this.jobs.updateStepStates(
      job.id,
      job.attempt,
      stepStates
    );
    if (!initialized.success) return this.persistenceFailed();
    const context = { user: buildRequesterUser(job.createdBy) };
    const allowed = await this.authorization.authorizeExistingImport(
      {
        collectiviteId: job.collectiviteId,
        options: job.options,
      },
      context
    );
    if (!allowed.success) {
      return failure([
        ElectrificationPersistenceErrors.issue(
          'ELECTRIFICATION_IMPORT_NOT_ALLOWED'
        ),
      ]);
    }
    const start = checkpoint
      ? success({ resumeFrom: checkpoint })
      : await this.readSource(job, telemetry);
    if (!start.success) return start;
    if (checkpoint) {
      telemetry.restoreDocument(job.stats?.document ?? null);
      telemetry.restoreTokens(checkpoint.tokens);
    }
    stepStates.reading = 'ok';
    const reading = await this.jobs.updateStepStates(
      job.id,
      job.attempt,
      stepStates
    );
    if (!reading.success) return this.persistenceFailed();

    const prepared = await telemetry.measure(
      'extraction',
      () =>
        this.preparation.prepare(
          {
            ...start.data,
            collectiviteId: job.collectiviteId,
            onCheckpoint: async (extracted) => {
              const saved = await this.jobs.saveCheckpoint(
                job.id,
                job.attempt,
                extracted
              );
              // Ne pas continuer après la perte du passage ou du point de reprise.
              if (!saved.success) throw new Error(saved.error);
            },
          },
          context
        ),
      (result) =>
        result.success
          ? { status: 'ok' }
          : { status: 'failed', error: result.error[0]?.code }
    );
    if (!prepared.success) return prepared;
    stepStates.extraction = 'ok';
    const extraction = await this.jobs.updateStepStates(
      job.id,
      job.attempt,
      stepStates
    );
    if (!extraction.success) return this.persistenceFailed();

    const created = await telemetry.measure(
      'persistence',
      () =>
        this.transactions.executeSingle<
          { planId: number; createdFicheIds: number[] },
          ElectrificationIssue[]
        >(async (tx) => {
          const persisted = await this.persistence.persist(
            {
              collectiviteId: job.collectiviteId,
              nom: job.options.planName,
              checkpoint: prepared.data.checkpoint,
            },
            { ...context, tx }
          );
          if (!persisted.success) return persisted;
          const { planId, report } = persisted.data;
          telemetry.addWarnings(report.issues.length);
          const importing = await this.verification.markAsImporting(planId, tx);
          if (!importing.success) return this.persistenceFailed();
          const completed = await this.completion.complete(
            {
              job,
              planId,
              stepStates,
              report,
              stats: telemetry.stats(),
              requiresVerification: false,
            },
            tx
          );
          return completed.success
            ? success(persisted.data)
            : this.persistenceFailed();
        }),
      (result) =>
        result.success
          ? {
              status: 'ok',
              details: { fichesCreated: result.data.createdFicheIds.length },
            }
          : { status: 'failed', error: result.error[0]?.code }
    );
    if (!created.success) {
      if (Array.isArray(created.error)) return created;
      this.logger.error(
        `Import ${job.id}: transaction impossible`,
        created.error
      );
      return this.persistenceFailed();
    }
    const { axes, fiches, fichesEngagements } = prepared.data.prepared;
    return success({
      ...created.data,
      stats: telemetry.stats(),
      recap: {
        axesCount: axes.filter((axe) => axe.parentKey === null).length,
        sousAxesCount: axes.filter((axe) => axe.parentKey !== null).length,
        fichesCount: fiches.length + fichesEngagements.length,
      },
    });
  }

  private async readSource(
    job: AiPlanImportJob,
    telemetry: ImportJobTelemetry
  ) {
    const source = await this.storage.downloadDocument({
      bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
      key: job.sourcePath,
    });
    if (!source.success)
      return failure<ElectrificationIssue[]>([
        ElectrificationExtractionErrors.issue('SOURCE_UNREADABLE'),
      ]);
    // Un job ou un fichier modifié ne doit jamais déclencher un OCR générique.
    if (!this.authorization.validateSource(source.data.mimeType).success)
      return failure([
        ElectrificationExtractionErrors.issue(
          'UNSUPPORTED_ELECTRIFICATION_DOCUMENT'
        ),
      ]);
    const document = await telemetry.measureDocument(() =>
      readDocument(source.data)
    );
    if (!document.success)
      return failure([
        ElectrificationExtractionErrors.issue(
          'INVALID_ELECTRIFICATION_DOCUMENT'
        ),
      ]);
    telemetry.setDocument(source.data, document.data);
    return success({ document: document.data });
  }

  private persistenceFailed(): Result<never, ElectrificationIssue[]> {
    return failure([
      ElectrificationPersistenceErrors.issue(
        'ELECTRIFICATION_PERSISTENCE_FAILED'
      ),
    ]);
  }
}
