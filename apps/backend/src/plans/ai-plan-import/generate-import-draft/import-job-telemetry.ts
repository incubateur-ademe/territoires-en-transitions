import { Logger } from '@nestjs/common';
import { recordLlmCalls } from '@tet/backend/utils/llm/llm-call-recorder';
import {
  emptyTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { AiPlanImportStepRunRepository } from '../ai-plan-import-step-run.repository';
import { ImportJobStats } from '../models/import-job-stats';
import {
  ImportStepRun,
  ImportStepRunStatus,
  ImportTrackedStep,
} from '../models/import-step-run';
import {
  computeLlmCallMetrics,
  LlmCallMetrics,
  sumLlmCallMetrics,
} from '../pipeline/compute-import-metrics';
import { ReadDocument } from '../pipeline/document/document-page';

type StepOutcome = {
  status: ImportStepRunStatus;
  details?: Record<string, number>;
  error?: string | null;
};

/**
 * Déroulé d'un import : chaque étape est enregistrée dès qu'elle se termine,
 * et le résumé chiffré s'assemble au fil du traitement. Une étape non
 * enregistrée ne fait pas échouer l'import. Une reprise ajoute ses appels à
 * ceux des passages précédents.
 */
export class ImportJobTelemetry {
  private readonly runs: ImportStepRun[] = [];
  private document: ImportJobStats['document'] = null;
  private content: ImportJobStats['content'] = null;
  private warnings = 0;
  private restoredTokens = emptyTokenUsage();

  constructor(
    private readonly jobId: string,
    private readonly strategy: string,
    private readonly stepRunRepository: AiPlanImportStepRunRepository,
    private readonly logger: Logger,
    private readonly resumed: {
      attempt: number;
      previousLlm: LlmCallMetrics;
    } = { attempt: 0, previousLlm: sumLlmCallMetrics([]) },
    /** Chaque étape enregistrée, pipeline, lecture du document et persistance. */
    private readonly onRecorded: (run: ImportStepRun) => void = () => undefined
  ) {}

  async record(run: ImportStepRun): Promise<void> {
    this.runs.push(run);
    this.onRecorded(run);
    const saved = await this.stepRunRepository.insert(
      this.jobId,
      run,
      this.resumed.attempt
    );
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

  /** Reprise : le document a été lu au premier passage. */
  restoreDocument(document: ImportJobStats['document']): void {
    this.document = document;
  }

  /**
   * Un checkpoint peut précéder les métriques de son étape. Il garantit un
   * minimum de tokens connus, sans inventer les appels ni les modèles manquants.
   */
  restoreTokens(tokens: TokenUsage): void {
    this.restoredTokens = tokens;
  }

  documentStats(): ImportJobStats['document'] {
    return this.document;
  }

  setContent(content: NonNullable<ImportJobStats['content']>): void {
    this.content = content;
  }

  addWarnings(count: number): void {
    this.warnings += count;
  }

  stats(): ImportJobStats {
    const { calls, failedCalls, rateLimited, tokens, models } =
      sumLlmCallMetrics([
        this.resumed.previousLlm,
        computeLlmCallMetrics(this.runs.flatMap((run) => run.calls)),
      ]);
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
        // Les appels déjà enregistrés incluent normalement ces tokens. Un arrêt
        // entre checkpoint et métriques ne doit ni les perdre ni les compter deux fois.
        tokens: {
          promptTokens: Math.max(
            tokens.promptTokens,
            this.restoredTokens.promptTokens
          ),
          cachedTokens: Math.max(
            tokens.cachedTokens,
            this.restoredTokens.cachedTokens
          ),
          candidatesTokens: Math.max(
            tokens.candidatesTokens,
            this.restoredTokens.candidatesTokens
          ),
          thoughtsTokens: Math.max(
            tokens.thoughtsTokens,
            this.restoredTokens.thoughtsTokens
          ),
          totalTokens: Math.max(
            tokens.totalTokens,
            this.restoredTokens.totalTokens
          ),
        },
      },
      warnings: this.warnings,
      resumes: this.resumed.attempt,
    };
  }
}
