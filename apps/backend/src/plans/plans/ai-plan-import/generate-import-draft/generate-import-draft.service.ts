import { Injectable } from '@nestjs/common';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { getErrorMessage } from '@tet/domain/utils';
import { AI_PLAN_IMPORT_SOURCE_BUCKET } from '../ai-plan-import.constants';
import { type AiPlanImportError } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportJob } from '../models/ai-plan-import-job.table';
import { ExtractionError, extractText } from './extract-text';
import {
  initialStepStates,
  PipelineError,
  runImportPipeline,
  StepName,
} from './run-import-pipeline';

export type GenerateImportDraftError =
  | { kind: 'transition_failed'; jobId: string; cause: AiPlanImportError }
  | { kind: 'failure_record_failed'; jobId: string; cause: AiPlanImportError }
  | { kind: 'draft_record_failed'; jobId: string; cause: AiPlanImportError }
  | { kind: 'interrupted'; jobId: string; message: string };

@Injectable()
export class GenerateImportDraftService {
  constructor(
    private readonly repository: AiPlanImportJobRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly llm: LlmService
  ) {}

  async generate(
    jobId: string
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const running = await this.repository.transitionToRunning(jobId);
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

  async markFailed(
    jobId: string,
    message: string
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    return this.repository.markFailed({
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
      const marked = await this.repository.markFailed({
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

    const done = await this.repository.markDone({
      id: job.id,
      draft: outcome.draft,
      stepStates: outcome.stepStates,
    });
    return done.success
      ? success(undefined)
      : failure({
          kind: 'draft_record_failed',
          jobId: job.id,
          cause: done.error,
        });
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
