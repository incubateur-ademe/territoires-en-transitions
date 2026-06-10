import { Injectable, Logger } from '@nestjs/common';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { AI_PLAN_IMPORT_SOURCE_BUCKET } from '../ai-plan-import.constants';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportJob } from '../models/ai-plan-import-job.table';
import { ExtractionError, extractText } from './extract-text';
import {
  initialStepStates,
  PipelineError,
  runImportPipeline,
} from './run-import-pipeline';

@Injectable()
export class GenerateImportDraftService {
  private readonly logger = new Logger(GenerateImportDraftService.name);

  constructor(
    private readonly repository: AiPlanImportJobRepository,
    private readonly supabase: SupabaseService,
    private readonly llm: LlmService
  ) {}

  async generate(jobId: string): Promise<Result<undefined, string>> {
    const job = await this.repository.getByIdRaw(jobId);
    if (!job.success) {
      return failure(`Job ${jobId} introuvable`);
    }

    const running = await this.repository.transitionToRunning(jobId);
    if (!running.success) {
      return failure(`Transition du job ${jobId} impossible`);
    }

    try {
      await this.runPipeline(job.data);
      return success(undefined);
    } finally {
      await this.removeSource(job.data.sourcePath);
    }
  }

  private async runPipeline(job: AiPlanImportJob): Promise<void> {
    const source = await this.downloadSource(job.sourcePath);
    if (!source.success) {
      await this.fail(job.id, 'Document source illisible depuis le stockage');
      return;
    }

    const text = await extractText(source.data);
    if (!text.success) {
      await this.fail(job.id, extractionErrorMessage(text.error));
      return;
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
      await this.repository.markFailed({
        id: job.id,
        error: pipelineErrorMessage(outcome.failedStep, outcome.error),
        stepStates: outcome.stepStates,
      });
      return;
    }

    await this.repository.markDone({
      id: job.id,
      draft: outcome.draft,
      stepStates: outcome.stepStates,
    });
  }

  private async downloadSource(
    sourcePath: string
  ): Promise<Result<{ buffer: Buffer; mimeType: string }, undefined>> {
    const { data, error } = await this.supabase.client.storage
      .from(AI_PLAN_IMPORT_SOURCE_BUCKET)
      .download(sourcePath);
    if (error || !data) {
      this.logger.error(
        `Téléchargement source ${sourcePath}: ${error?.message ?? 'objet absent'}`
      );
      return failure(undefined);
    }
    return success({
      buffer: Buffer.from(await data.arrayBuffer()),
      mimeType: data.type,
    });
  }

  private async fail(jobId: string, message: string): Promise<void> {
    await this.repository.markFailed({
      id: jobId,
      error: message,
      stepStates: initialStepStates(),
    });
  }

  private async removeSource(sourcePath: string): Promise<void> {
    const { error } = await this.supabase.client.storage
      .from(AI_PLAN_IMPORT_SOURCE_BUCKET)
      .remove([sourcePath]);
    if (error) {
      this.logger.error(
        `Suppression source ${sourcePath}: ${getErrorMessage(error)}`
      );
    }
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
  failedStep: string,
  error: PipelineError
): string => `Étape ${failedStep} en échec (${error.kind})`;
