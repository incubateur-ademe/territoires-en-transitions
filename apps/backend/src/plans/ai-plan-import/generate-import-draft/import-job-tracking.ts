import type { TrackedEventPropertyValue } from '@tet/backend/utils/tracking/event-tracker.interface';
import { resolveImportProfile } from '../models/import-profile';
import type { AiPlanImportJob } from '../models/ai-plan-import-job';
import type { ImportJobStats } from '../models/import-job-stats';
import type { ImportStepRun } from '../models/import-step-run';
import {
  type ActionLevelDoubt,
  changedKindsOf,
  type ImportChoice,
  type ImportDoubt,
} from '../models/import-question';

type Properties = Record<string, TrackedEventPropertyValue>;

/**
 * Ce que tout événement d'un job dit de lui : d'où il a été lancé, pour quelle
 * démarche, à quel passage. En camelCase, comme les événements d'import déjà
 * émis, pour ne pas casser les tableaux de bord existants.
 */
export const jobTrackingProperties = (job: AiPlanImportJob): Properties => ({
  collectiviteId: job.collectiviteId,
  jobId: job.id,
  planId: job.createdPlanId ?? undefined,
  profile: resolveImportProfile(job.options.profile),
  contractVersion: job.options.contractVersion,
  schemaVersion: job.options.schemaVersion,
  catalogueVersion: job.options.catalogueVersion ?? undefined,
  attempt: job.attempt,
  planType: job.options.planType,
  withVerifications: job.options.withVerifications,
  withSousActions: job.options.withSousActions,
  withSecteurs: job.options.withSecteurs,
  origine: job.options.origine,
  demarcheId: job.options.demarcheId,
});

/** Le document lu, les appels au modèle et le contenu extrait, s'ils sont connus. */
export const statsTrackingProperties = (
  stats: ImportJobStats | null | undefined
): Properties =>
  stats
    ? {
        strategy: stats.llm.strategy,
        failedCalls: stats.llm.failedCalls,
        rateLimited: stats.llm.rateLimited,
        promptTokens: stats.llm.tokens.promptTokens,
        candidatesTokens: stats.llm.tokens.candidatesTokens,
        documentKind: stats.document?.kind,
        pageCount: stats.document?.pageCount,
        ocrPages: stats.document?.ocrPages,
        emptyPages: stats.document?.emptyPages,
        sizeBytes: stats.document?.sizeBytes,
        sousActionsCount: stats.content?.sousActions,
        profondeurAxes: stats.content?.profondeurAxes,
        actionsSansAxe: stats.content?.actionsSansAxe,
        duplicates: stats.content?.duplicates,
        truncatedTitles: stats.content?.truncatedTitles,
        scored: stats.content?.scored,
        improved: stats.content?.improved,
        warnings: stats.warnings,
        resumes: stats.resumes,
      }
    : {};

/**
 * Une étape du pipeline. Ni son message d'erreur ni ses détails textuels : ils
 * peuvent citer le document importé.
 */
export const stepRunTrackingProperties = (run: ImportStepRun): Properties => ({
  step: run.step,
  status: run.status,
  durationMs: run.endedAt.getTime() - run.startedAt.getTime(),
  llmCalls: run.calls.length,
  failedCalls: run.calls.filter(({ error }) => error !== null).length,
  rateLimitedCalls: run.calls.filter(
    ({ error }) => error?.kind === 'rate_limited'
  ).length,
  totalTokens: run.calls.reduce(
    (total, { usage }) => total + (usage?.totalTokens ?? 0),
    0
  ),
  models: [...new Set(run.calls.map(({ model }) => model))].sort().join(','),
});

/**
 * Les doutes posés, et la réponse si elle est donnée. `actionLevel` et
 * `proposed` restent pour les tableaux de bord d'avant les questions multiples.
 */
export const questionTrackingProperties = (
  doubts: ImportDoubt[],
  choices?: ImportChoice[]
): Properties => {
  const actionLevelDoubt = doubts.find(
    (doubt): doubt is ActionLevelDoubt => doubt.kind === 'action-level'
  );
  const actionLevelChoice = choices?.find(
    (choice): choice is Extract<ImportChoice, { kind: 'action-level' }> =>
      choice.kind === 'action-level'
  );
  return {
    questionKinds: doubts.map(({ kind }) => kind),
    questionCount: doubts.length,
    proposed: actionLevelDoubt?.proposed,
    ...(choices && {
      actionLevel: actionLevelChoice?.actionLevel,
      changedKinds: changedKindsOf(doubts, choices),
    }),
  };
};
