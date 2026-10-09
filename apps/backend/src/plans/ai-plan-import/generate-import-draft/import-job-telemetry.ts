import { Logger } from '@nestjs/common';
import { recordLlmCalls } from '@tet/backend/utils/llm/llm-call-recorder';
import { AiPlanImportStepRunRepository } from '../ai-plan-import-step-run.repository';
import { ImportJobStats } from '../models/import-job-stats';
import {
  ImportStepRun,
  ImportStepRunStatus,
  ImportTrackedStep,
} from '../models/import-step-run';
import { computeLlmCallMetrics } from '../pipeline/compute-import-metrics';
import { ReadDocument } from '../pipeline/document/document-page';

type StepOutcome = {
  status: ImportStepRunStatus;
  details?: Record<string, number>;
  error?: string | null;
};

/**
 * Déroulé d'un import : chaque étape est enregistrée dès qu'elle se termine,
 * et le résumé chiffré s'assemble au fil du traitement. Une étape non
 * enregistrée ne fait pas échouer l'import.
 */
export class ImportJobTelemetry {
  private readonly runs: ImportStepRun[] = [];
  private document: ImportJobStats['document'] = null;
  private content: ImportJobStats['content'] = null;
  private warnings = 0;

  constructor(
    private readonly jobId: string,
    private readonly strategy: string,
    private readonly stepRunRepository: AiPlanImportStepRunRepository,
    private readonly logger: Logger
  ) {}

  async record(run: ImportStepRun): Promise<void> {
    this.runs.push(run);
    const saved = await this.stepRunRepository.insert(this.jobId, run);
    if (!saved.success) {
      this.logger.warn(
        `Import ${this.jobId}: étape ${run.step} non enregistrée (${saved.error})`
      );
    }
  }

  /** Mesure une étape faite hors pipeline, avec ses appels au modèle. */
  async measure<T>(
    step: ImportTrackedStep,
    run: () => Promise<T>,
    describe: (result: T) => StepOutcome
  ): Promise<T> {
    const startedAt = new Date();
    const { result, calls } = await recordLlmCalls(run);
    const { status, details = {}, error = null } = describe(result);
    await this.record({
      step,
      status,
      startedAt,
      endedAt: new Date(),
      calls,
      details,
      error,
    });
    return result;
  }

  setDocument(
    source: { buffer: Buffer; mimeType: string },
    document: ReadDocument
  ): void {
    this.document = {
      kind: document.kind,
      mimeType: source.mimeType,
      sizeBytes: source.buffer.length,
      ...document.stats,
      ocrFailures: document.ocrFailures.length,
      chars: document.pages.reduce((total, page) => total + page.charCount, 0),
    };
  }

  setContent(content: NonNullable<ImportJobStats['content']>): void {
    this.content = content;
  }

  addWarnings(count: number): void {
    this.warnings += count;
  }

  stats(): ImportJobStats {
    const { calls, failedCalls, rateLimited, tokens, models } =
      computeLlmCallMetrics(this.runs.flatMap((run) => run.calls));
    return {
      schemaVersion: 1,
      content: this.content,
      document: this.document,
      llm: {
        strategy: this.strategy,
        models,
        calls,
        failedCalls,
        rateLimited,
        tokens,
      },
      warnings: this.warnings,
    };
  }
}
