import { Injectable } from '@nestjs/common';
import { ImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.input';
import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { AuthRole, type AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { getErrorMessage } from '@tet/domain/utils';
import { AI_PLAN_IMPORT_SOURCE_BUCKET } from '../ai-plan-import.constants';
import { type AiPlanImportError } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportJob } from '../models/ai-plan-import-job';
import { PlanDraft } from '../models/plan-draft';
import { draftToImportPlanInput } from './draft-to-import-plan-input';
import { ExtractionError, extractText } from './extract-text';
import {
  initialStepStates,
  PipelineError,
  runImportPipeline,
  StepName,
  StepStates,
} from './run-import-pipeline';

export type GenerateImportDraftError =
  | { kind: 'transition_failed'; jobId: string; cause: AiPlanImportError }
  | { kind: 'failure_record_failed'; jobId: string; cause: AiPlanImportError }
  | { kind: 'interrupted'; jobId: string; message: string };

@Injectable()
export class GenerateImportDraftService {
  constructor(
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly llm: LlmService,
    private readonly importPlanService: ImportPlanService,
    private readonly transactionManager: TransactionManager
  ) {}

  async generate(
    jobId: string
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const running = await this.jobRepository.transitionToRunning(jobId);
    if (!running.success) {
      return failure({ kind: 'transition_failed', jobId, cause: running.error });
    }
    const job = running.data;

    try {
      return await this.runPipeline(job);
    } catch (error) {
      const message = `Import interrompu: ${getErrorMessage(error)}`;
      await this.markFailed(jobId, message);
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
    await this.markFailed(jobId, message);
    if (job.success) {
      await this.documentStorage.removeDocument({
        bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
        key: job.data.sourcePath,
      });
    }
  }

  private async markFailed(
    jobId: string,
    message: string
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    return this.jobRepository.markFailed({
      id: jobId,
      error: message,
      stepStates: initialStepStates(),
    });
  }

  private async runPipeline(
    job: AiPlanImportJob
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const source = await this.tryDownloadSource(job.sourcePath);
    if (source === null) {
      return this.recordFailure(
        job.id,
        'Document source illisible depuis le stockage'
      );
    }

    const text = await extractText(source);
    if (!text.success) {
      return this.recordFailure(job.id, extractionErrorMessage(text.error));
    }

    const outcome = await runImportPipeline(this.llm, {
      text: text.data,
      instructions: job.options.instructions,
      disabledFields: job.options.disabledFields,
      currentDate: new Date().toISOString(),
      withVerifications: job.options.withVerifications,
      withSousActions: job.options.withSousActions,
    });

    if (outcome.status === 'failed') {
      const marked = await this.jobRepository.markFailed({
        id: job.id,
        error: pipelineErrorMessage(outcome.failedStep, outcome.error),
        stepStates: outcome.stepStates,
      });
      return marked.success
        ? success(undefined)
        : failure({
            kind: 'failure_record_failed',
            jobId: job.id,
            cause: marked.error,
          });
    }

    return this.persistDraftAsPlan(job, outcome.draft, outcome.stepStates);
  }

  private async persistDraftAsPlan(
    job: AiPlanImportJob,
    draft: PlanDraft,
    stepStates: StepStates
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const planInput = draftToImportPlanInput({
      actions: draft.actions,
      planName: job.options.planName,
      planType: job.options.planType,
    });

    const created = await this.transactionManager.executeSingle<number, string>(
      async (tx) => {
        const planId = await this.createPlan(planInput, job, tx);
        if (!planId.success) {
          return planId;
        }
        const done = await this.jobRepository.markDone({
          id: job.id,
          draft,
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
      return this.recordFailure(job.id, created.error);
    }
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
    message: string
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const marked = await this.markFailed(jobId, message);
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

const buildRequesterUser = (userId: string): AuthenticatedUser => ({
  id: userId,
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
});

const extractionErrorMessage = (error: ExtractionError): string => {
  switch (error.kind) {
    case 'unsupported_mime':
      return `Type de fichier non supporté (${error.mimeType})`;
    case 'empty_text':
      return 'Document vide ou probablement scanné (aucun texte extractible)';
    case 'parse_failed':
      return 'Lecture du document impossible';
    case 'timeout':
      return 'Lecture du document trop longue';
  }
};

const pipelineErrorMessage = (
  failedStep: StepName,
  error: PipelineError
): string => `Étape ${failedStep} en échec (${error.kind})`;
