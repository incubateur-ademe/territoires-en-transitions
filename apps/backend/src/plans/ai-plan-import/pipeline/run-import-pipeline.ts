import { DisableableField } from '../models/disableable-field';
import { upperFirst } from 'es-toolkit';
import {
  analyzeWorkbook,
  WorkbookAnalysis,
} from './analyze-workbook/analyze-workbook';
import { SheetRole } from './analyze-workbook/classify-sheets';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import {
  isTabularKind,
  joinPages,
  ReadDocument,
} from './document/document-page';
import { structureUnits } from './extract-actions/structure-units';
import { consolidateHierarchy } from './consolidate-hierarchy/consolidate-hierarchy';
import { dropRedundantSousAxes } from './consolidate-hierarchy/drop-redundant-sous-axes';
import { PlanSkeleton } from '../models/plan-skeleton';
import {
  detectDocumentTome,
  WrongTome,
} from './detect-document-tome/detect-document-tome';
import { scoutUnits } from './scout-units/scout-units';
import { DocumentUnit } from './segment-document/document-unit';
import { hasMergedRowGroups } from './segment-document/cut-tabular-units';
import { segmentDocument } from './segment-document/segment-document';
import { coalesceChunks } from './source-chunks/coalesce-chunks';
import { SourceChunks } from './source-chunks/source-chunks';
import { splitDocument } from './split-document/split-document';
import {
  emptyTokenUsage,
  sumTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { recordLlmCalls } from '@tet/backend/utils/llm/llm-call-recorder';
import { describeLlmError } from '@tet/backend/utils/llm/llm.errors';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { ExtractedAction, isPinnedAction } from '../models/extracted-action';
import type { ImportStepRun } from '../models/import-step-run';
import { PlanDraft } from '../models/plan-draft';
import { classifySecteurs } from './classify-secteurs/classify-secteurs';
import { consolidateActions } from './consolidate-actions/consolidate-actions';
import { enrichSousActions } from './enrich-sous-actions/enrich-sous-actions';
import {
  ExtractActionsError,
  extractActions,
} from './extract-actions/extract-actions';
import { reviewQuality } from './qualitative-review/qualitative-review';
import { scoreActions } from './score-actions/score-actions';
import {
  PIPELINE_CHECKPOINT_SCHEMA_VERSION,
  type PipelineCheckpoint,
  type PipelineProgress,
  type PipelineState,
} from './pipeline-checkpoint';

const stepStateSchema = z.enum(['ok', 'skipped', 'pending']);

// Les étapes ajoutées après coup ont un défaut : les jobs déjà en base n'en
// ont pas la trace, et le routeur de statut valide ce qu'il lit.
export const stepStatesSchema = z.object({
  reading: stepStateSchema.default('skipped'),
  scouting: stepStateSchema.default('skipped'),
  extraction: stepStateSchema,
  hierarchy: stepStateSchema.default('skipped'),
  scoring: stepStateSchema,
  consolidation: stepStateSchema,
  enrichment: stepStateSchema,
  secteurs: stepStateSchema.default('skipped'),
  qualitativeReview: stepStateSchema,
});

export type StepState = z.infer<typeof stepStateSchema>;

export type StepStates = z.infer<typeof stepStatesSchema>;

export type StepName = keyof StepStates;

export type ReadingError =
  | {
      kind: 'document_too_long';
      chunks: number;
      maxChunks: number;
    }
  | {
      /** Le document déposé est un autre tome du PCAET, sans fiche action. */
      kind: 'wrong_document_tome';
      tome: WrongTome;
      evidence: string;
    };

export type PipelineError = ExtractActionsError | ReadingError;

/** L'erreur en une ligne : le statut HTTP ou la règle violée quand il y en a. */
export const describePipelineError = (error: PipelineError): string =>
  error.kind === 'api_error' || error.kind === 'invalid_json'
    ? describeLlmError(error)
    : error.kind;

export type PipelineLlm = Pick<
  LlmService,
  'generateStructured' | 'maxInputTokens' | 'capabilities'
>;

/** Reprise d'une tranche à l'autre, pour ne pas couper une action en deux. */
const CHUNK_OVERLAP_TOKENS = 1_500;
/**
 * Garde-fou de coût : au-delà, ce n'est plus un plan d'action. Avec Albert,
 * 10 tranches font environ 600 000 tokens, soit plusieurs centaines de pages.
 */
export const MAX_DOCUMENT_CHUNKS = 10;
/** Même garde-fou pour la stratégie segmentée, à la maille de la fiche. */
export const MAX_DOCUMENT_UNITS = 300;
/**
 * Les vérifications relisent des fenêtres d'unités adjacentes : elles n'ont
 * pas besoin de la finesse d'une fiche, et un appel par fiche coûterait cher.
 */
const VERIFICATION_WINDOW_TOKENS = 12_000;

export type RunImportPipelineInput = {
  instructions: string;
  disabledFields: DisableableField[];
  currentDate: string;
  withVerifications: boolean;
  withSousActions: boolean;
  /** Secteurs réglementaires proposés pour chaque action : plans PCAET. */
  withSecteurs?: boolean;
  signal?: AbortSignal;
  onStepStatesChange?: (stepStates: Readonly<StepStates>) => Promise<void>;
  /** Chaque étape terminée, passée ou en échec : durée, appels, comptes. */
  onStepRun?: (run: ImportStepRun) => Promise<void>;
  /** Après chaque étape terminée : de quoi reprendre l'import à cet endroit. */
  onCheckpoint?: (checkpoint: PipelineCheckpoint) => Promise<void>;
} & (
  | { document: ReadDocument; resumeFrom?: undefined }
  // Reprise : la lecture est faite, le document n'est pas relu.
  | { document?: undefined; resumeFrom: PipelineCheckpoint }
);

export type PipelineOutcome =
  | {
      status: 'done';
      draft: PlanDraft;
      /** Ce qui a été écarté en route sans faire échouer l'import. */
      warnings: string[];
      stepStates: StepStates;
      tokens: TokenUsage;
    }
  | {
      status: 'failed';
      failedStep: StepName;
      error: PipelineError;
      /** Les actions telles qu'avant l'étape en échec : de quoi comprendre. */
      partialDraft: PlanDraft;
      warnings: string[];
      stepStates: StepStates;
      tokens: TokenUsage;
    };

type Progress = PipelineProgress;

type StepProduce = {
  actions?: ExtractedAction[];
  review?: string | null;
  tokens: TokenUsage;
  warnings?: string[];
  /** Comptes propres à l'étape, pour la télémétrie. */
  details?: Record<string, number>;
};

type StepGo =
  | { success: true; progress: Progress }
  | { success: false; error: PipelineError };

type BranchFailure = { step: StepName; error: PipelineError };

/** Une étape d'une branche, et la progression de la branche après elle. */
type BranchStep = { name: StepName; progress: Progress };

/** Une étape après la lecture. */
type PipelineStep = {
  name: StepName;
  /** Évalué au moment de l'étape : il dépend de ce qu'ont produit les précédentes. */
  skipWhen?: () => boolean;
  run: (
    actions: ExtractedAction[]
  ) => Promise<Result<StepProduce, PipelineError>>;
  /** Appliqué au résultat, passé ou non, avant le point de reprise. */
  finalize?: (progress: Progress) => Progress;
};

/**
 * Un point de reprise vaut pour toutes les étapes jusqu'à la sienne dans cet
 * ordre, y compris celles qui tournent en parallèle.
 */
const STEP_ORDER = stepStatesSchema.keyof().options;

/** Après la dernière étape, plus rien ne lit le découpage : tout modèle convient. */
export const isCheckpointUsableBy = (
  checkpoint: Pick<
    PipelineCheckpoint,
    'schemaVersion' | 'llm' | 'completedStep'
  >,
  llm: PipelineLlm
): boolean =>
  checkpoint.schemaVersion === PIPELINE_CHECKPOINT_SCHEMA_VERSION &&
  (checkpoint.completedStep === STEP_ORDER[STEP_ORDER.length - 1] ||
    (checkpoint.llm?.strategy === llm.capabilities.strategy &&
      checkpoint.llm?.maxInputTokens === llm.maxInputTokens));

export const runImportPipeline = async (
  llm: PipelineLlm,
  input: RunImportPipelineInput
): Promise<PipelineOutcome> => {
  const reportProgress = (stepStates: StepStates): Promise<void> =>
    input.onStepStatesChange?.(stepStates) ?? Promise.resolve();

  const reportStepRun = (run: ImportStepRun): Promise<void> =>
    input.onStepRun?.(run) ?? Promise.resolve();

  let state: PipelineState;
  let tabularRowGroups: boolean | undefined;
  if (input.resumeFrom) {
    // Les actions lues par le code sont dans `progress.actions` : la reprise
    // les retrouve sans relire le classeur.
    const { progress, chunks, units, skeleton, source } = input.resumeFrom;
    state = { progress, chunks, units, skeleton, source };
    tabularRowGroups = input.resumeFrom.tabularRowGroups;
  } else {
    const readingStartedAt = new Date();
    const read = readSource(llm, input.document, input.disabledFields);
    await reportStepRun({
      step: 'reading',
      status: read.success ? 'ok' : 'failed',
      startedAt: readingStartedAt,
      endedAt: new Date(),
      calls: [],
      details: read.success ? describeReading(read.data) : {},
      error: read.success ? null : read.error.kind,
    });
    if (!read.success) {
      return failed(initialProgress(), 'reading', read.error);
    }
    const { analysis } = read.data;
    const progress = markOk(initialProgress(), 'reading');
    state = {
      progress: {
        ...progress,
        actions: analysis?.actions ?? [],
        warnings: analysis ? readingWarnings(analysis, input) : [],
      },
      chunks: read.data.chunks,
      units: read.data.units,
      skeleton: null,
      source: analysis
        ? coalesceChunks(analysis.source, VERIFICATION_WINDOW_TOKENS)
        : { chunks: read.data.chunks, chunkIndexByAction: [] },
    };
    tabularRowGroups = read.data.tabularRowGroups;
  }

  const documentKind = input.resumeFrom
    ? input.resumeFrom.documentKind
    : input.document.kind;
  const tabular = documentKind !== undefined && isTabularKind(documentKind);
  const hasModelInput = (): boolean =>
    state.units ? state.units.length > 0 : state.chunks.length > 0;
  const allPinned = (): boolean =>
    state.progress.actions.length > 0 &&
    state.progress.actions.every(isPinnedAction);

  const checkpoint = (
    completedStep: StepName,
    progress: Progress = state.progress
  ): Promise<void> =>
    input.onCheckpoint?.({
      schemaVersion: PIPELINE_CHECKPOINT_SCHEMA_VERSION,
      completedStep,
      currentDate: input.currentDate,
      documentKind,
      tabularRowGroups,
      llm: {
        strategy: llm.capabilities.strategy,
        maxInputTokens: llm.maxInputTokens,
      },
      ...state,
      progress,
    }) ?? Promise.resolve();

  if (!input.resumeFrom) {
    await checkpoint('reading');
  }
  await reportProgress(state.progress.stepStates);

  const sequentialSteps: PipelineStep[] = [
    // Écarter ce qui ne contient pas d'action et relever le squelette du plan :
    // seulement quand le document est lu par unités.
    {
      name: 'scouting',
      skipWhen: () => state.units === null || state.units.length === 0,
      run: async () => {
        const result = await scoutUnits(llm, {
          units: state.units as DocumentUnit[],
          signal: input.signal,
        });
        if (!result.success) {
          return result;
        }
        state.units = result.data.keptUnits;
        state.skeleton = result.data.skeleton;
        return success({
          tokens: result.data.tokens,
          warnings: result.data.warnings,
          details: {
            keptUnits: result.data.keptUnits.length,
            discardedUnits: result.data.discardedCount,
          },
        });
      },
    },
    // Les étapes suivantes conservent l'ordre des actions : la tranche
    // d'origine relevée à l'extraction reste valable pour elles.
    {
      name: 'extraction',
      // Les actions déjà là sont celles que le code a lues dans le classeur :
      // celles du modèle viennent après elles.
      run: async (tabularActions) => {
        if (!hasModelInput()) {
          return tabularActions.length > 0
            ? success({ actions: tabularActions, tokens: emptyTokenUsage() })
            : failure({ kind: 'no_actions_extracted' as const });
        }
        const extraction = {
          instructions: input.instructions,
          disabledFields: input.disabledFields,
          currentDate: input.currentDate,
          spreadsheet: tabular,
          rowsAreFiches: tabular && tabularRowGroups !== true,
          signal: input.signal,
        };
        const result = state.units
          ? await structureUnits(llm, {
              units: state.units,
              skeleton: state.skeleton,
              ...extraction,
            }).then((structured) => {
              if (structured.success) {
                state.chunks = structured.data.chunks;
              }
              return structured;
            })
          : await extractActions(llm, { chunks: state.chunks, ...extraction });
        if (!result.success) {
          return withTabularActions(result, tabularActions);
        }
        state.source = appendSource(state.source, tabularActions, {
          chunks: state.chunks,
          chunkIndexByAction: result.data.chunkIndexByAction,
        });
        return success({
          ...result.data,
          actions: [...tabularActions, ...result.data.actions],
        });
      },
    },
    // Rattacher chaque action au squelette et fondre les doublons : des
    // extraits lus séparément ne se coordonnent pas seuls.
    {
      name: 'hierarchy',
      skipWhen: () =>
        state.units === null || state.skeleton === null || allPinned(),
      run: async (actions) => {
        const result = await consolidateHierarchy(llm, {
          actions,
          skeleton: state.skeleton as PlanSkeleton,
          signal: input.signal,
        });
        if (!result.success) {
          return result;
        }
        const { source } = state;
        state.source = {
          chunks: source.chunks,
          chunkIndexByAction: result.data.keptIndexes.map(
            (index) => source.chunkIndexByAction[index]
          ),
        };
        return success({
          actions: result.data.actions,
          tokens: result.data.tokens,
          warnings: result.data.warnings,
        });
      },
      // Passée ou non : le sommaire et la fiche se répondent, une fiche peut
      // s'y retrouver sous-axe d'elle-même, quelle que soit la lecture.
      finalize: (progress) => {
        if (state.units) {
          state.source = coalesceChunks(
            state.source,
            VERIFICATION_WINDOW_TOKENS
          );
        }
        return {
          ...progress,
          actions: dropRedundantSousAxes(progress.actions),
        };
      },
    },
    {
      name: 'scoring',
      skipWhen: () => !input.withVerifications || allPinned(),
      run: (actions) =>
        scoreActions(llm, {
          actions,
          source: state.source,
          signal: input.signal,
        }),
    },
    {
      name: 'consolidation',
      skipWhen: () => !input.withVerifications || allPinned(),
      run: (actions) =>
        consolidateActions(llm, {
          actions,
          source: state.source,
          disabledFields: input.disabledFields,
          signal: input.signal,
        }),
    },
  ];

  // Deux branches en parallèle après la consolidation, qui recrée les
  // sous-actions : les secteurs ne lisent rien de ce qu'écrit l'enrichissement
  // et n'écrivent que `action.secteurs`, que la revue ne lit pas.
  // Une branche en échec arrête l'autre : la reprise repartira d'avant les
  // deux, et chaque appel de plus y serait payé deux fois.
  const branchAbort = new AbortController();
  const branchSignal = input.signal
    ? AbortSignal.any([input.signal, branchAbort.signal])
    : branchAbort.signal;
  const enrichmentBranch: PipelineStep[] = [
    {
      name: 'enrichment',
      skipWhen: () => !input.withSousActions || allPinned(),
      run: (actions) =>
        enrichSousActions(llm, {
          actions,
          source: state.source,
          disabledFields: input.disabledFields,
          signal: branchSignal,
        }),
    },
    {
      name: 'qualitativeReview',
      run: (actions) => reviewQuality(llm, { actions, signal: branchSignal }),
    },
  ];
  const secteursBranch: PipelineStep[] = [
    {
      name: 'secteurs',
      skipWhen: () => !input.withSecteurs,
      run: (actions) =>
        classifySecteurs(llm, {
          actions,
          source: state.source,
          signal: branchSignal,
        }),
    },
  ];

  // Un point de reprise d'avant la mise en parallèle peut s'arrêter entre
  // l'enrichissement et la revue : chaque branche saute ce qui est fait.
  const lastCompleted = STEP_ORDER.indexOf(
    input.resumeFrom?.completedStep ?? 'reading'
  );
  const isCompleted = (name: StepName): boolean =>
    STEP_ORDER.indexOf(name) <= lastCompleted;

  for (const step of sequentialSteps) {
    if (isCompleted(step.name)) {
      continue;
    }
    const go = await runStep(reportStepRun, state.progress, step);
    if (!go.success) return failed(state.progress, step.name, go.error);
    state.progress = go.progress;
    await checkpoint(step.name);
    await reportProgress(state.progress.stepStates);
  }

  // Sans enrichissement, les secteurs ne doivent pas citer des sous-actions
  // absentes du plan.
  const forked = input.withSousActions
    ? state.progress
    : clearSousActions(state.progress);
  const stepStates = { ...forked.stepStates };
  // Jetons et avertissements comptés à part dans chaque branche.
  const branchStart: Progress = {
    ...forked,
    tokens: emptyTokenUsage(),
    warnings: [],
  };
  const enrichmentSteps: BranchStep[] = [];
  const secteursSteps: BranchStep[] = [];
  const branchProgressUpTo = (steps: BranchStep[], upTo: number): Progress =>
    steps.filter(({ name }) => STEP_ORDER.indexOf(name) <= upTo).at(-1)
      ?.progress ?? branchStart;
  // L'état vrai jusqu'à l'étape `upTo` incluse : ce que l'autre branche a fait
  // au-delà n'y figure pas, la reprise le refera.
  const joinUpTo = (upTo: number): Progress => {
    const enriched = branchProgressUpTo(enrichmentSteps, upTo);
    const classified = branchProgressUpTo(secteursSteps, upTo);
    const states = { ...stepStates };
    for (const name of STEP_ORDER.slice(upTo + 1)) {
      states[name] = forked.stepStates[name];
    }
    return {
      actions: enriched.actions.map((action, index) => {
        const secteurs = classified.actions[index]?.secteurs;
        return secteurs === undefined ? action : { ...action, secteurs };
      }),
      review: enriched.review,
      tokens: sumTokenUsage([
        forked.tokens,
        enriched.tokens,
        classified.tokens,
      ]),
      stepStates: states,
      warnings: [
        ...forked.warnings,
        ...enriched.warnings,
        ...classified.warnings,
      ],
    };
  };
  let checkpointed = lastDoneIndex(stepStates);
  // Les deux branches écrivent chacune de leur côté : en série, pour qu'un
  // état plus ancien n'en écrase pas un plus récent. Une écriture en échec ne
  // fait lever que la branche qui l'a demandée.
  let published = Promise.resolve();
  const publish = (write: () => Promise<void>): Promise<void> => {
    const written = published.then(write);
    published = written.catch(() => undefined);
    return written;
  };
  const runBranch = async (
    branch: PipelineStep[],
    ranSteps: BranchStep[]
  ): Promise<BranchFailure | null> => {
    for (const step of branch) {
      if (isCompleted(step.name)) {
        continue;
      }
      if (branchAbort.signal.aborted) {
        return null;
      }
      try {
        const go = await runStep(
          reportStepRun,
          ranSteps.at(-1)?.progress ?? branchStart,
          step
        );
        // Arrêtée par l'autre branche : ce qu'elle a fait depuis ne compte pas.
        if (branchAbort.signal.aborted) {
          return null;
        }
        if (!go.success) {
          branchAbort.abort();
          return { step: step.name, error: go.error };
        }
        ranSteps.push({ name: step.name, progress: go.progress });
        stepStates[step.name] = go.progress.stepStates[step.name];
        // Un point de reprise dès que la suite des étapes faites s'allonge.
        const reached = lastDoneIndex(stepStates);
        const saved = reached > checkpointed ? joinUpTo(reached) : null;
        checkpointed = Math.max(checkpointed, reached);
        const snapshot = { ...stepStates };
        await publish(async () => {
          if (saved) {
            await checkpoint(STEP_ORDER[reached], saved);
          }
          await reportProgress(snapshot);
        });
      } catch (error) {
        // Arrêtée par l'autre branche : c'est son échec qui compte.
        if (branchAbort.signal.aborted && !input.signal?.aborted) {
          return null;
        }
        branchAbort.abort();
        throw error;
      }
    }
    return null;
  };
  const failures = await settleAll([
    runBranch(enrichmentBranch, enrichmentSteps),
    runBranch(secteursBranch, secteursSteps),
  ]);

  state.progress = joinUpTo(STEP_ORDER.length - 1);
  const branchFailure = failures.find((branch) => branch !== null);
  if (branchFailure) {
    return failed(state.progress, branchFailure.step, branchFailure.error);
  }
  return done(state.progress);
};

/** L'étape avant la première qui reste à faire. */
const lastDoneIndex = (stepStates: StepStates): number => {
  const firstPending = STEP_ORDER.findIndex(
    (name) => stepStates[name] === 'pending'
  );
  return firstPending === -1 ? STEP_ORDER.length - 1 : firstPending - 1;
};

/** Attend chaque branche, même quand l'autre lève : aucun appel ne reste en vol. */
const settleAll = async <T>(promises: Promise<T>[]): Promise<T[]> => {
  const settled = await Promise.allSettled(promises);
  const rejected = settled.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );
  if (rejected) {
    throw rejected.reason;
  }
  return settled.map((result) => (result as PromiseFulfilledResult<T>).value);
};

const runStep = async (
  reportStepRun: (run: ImportStepRun) => Promise<void>,
  progress: Progress,
  { name, skipWhen, run, finalize = (done) => done }: PipelineStep
): Promise<StepGo> => {
  const startedAt = new Date();
  if (skipWhen?.()) {
    await reportStepRun({
      step: name,
      status: 'skipped',
      startedAt,
      endedAt: startedAt,
      calls: [],
      details: {},
      error: null,
    });
    return { success: true, progress: finalize(markSkipped(progress, name)) };
  }

  const recorded = await recordLlmCalls(() => run(progress.actions)).catch(
    async (error: unknown) => {
      await reportStepRun({
        step: name,
        status: 'failed',
        startedAt,
        endedAt: new Date(),
        calls: [],
        details: { actionsIn: progress.actions.length },
        error: 'interrupted',
      });
      throw error;
    }
  );
  const { result, calls } = recorded;
  await reportStepRun({
    step: name,
    status: result.success ? 'ok' : 'failed',
    startedAt,
    endedAt: new Date(),
    calls,
    details: {
      actionsIn: progress.actions.length,
      ...(result.success && {
        actionsOut: (result.data.actions ?? progress.actions).length,
        warnings: result.data.warnings?.length ?? 0,
        ...result.data.details,
      }),
    },
    error: result.success ? null : describePipelineError(result.error),
  });
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return {
    success: true,
    progress: finalize(mergeStepResult(progress, name, result.data)),
  };
};

const mergeStepResult = (
  progress: Progress,
  name: StepName,
  produce: StepProduce
): Progress => ({
  actions: produce.actions ?? progress.actions,
  review: produce.review ?? progress.review,
  tokens: sumTokenUsage([progress.tokens, produce.tokens]),
  stepStates: { ...progress.stepStates, [name]: 'ok' },
  warnings: [...progress.warnings, ...(produce.warnings ?? [])],
});

const markSkipped = (progress: Progress, name: StepName): Progress => ({
  ...progress,
  stepStates: { ...progress.stepStates, [name]: 'skipped' },
});

const markOk = (progress: Progress, name: StepName): Progress => ({
  ...progress,
  stepStates: { ...progress.stepStates, [name]: 'ok' },
});

type ReadSource = {
  chunks: string[];
  units: DocumentUnit[] | null;
  /** Un tableur : ce que le code en a lu, le reste allant au modèle. */
  analysis: WorkbookAnalysis | null;
  tabularRowGroups: boolean;
};

/**
 * Le document tel que l'extraction le lira : des unités de la taille d'une
 * fiche pour un modèle qui résume au-delà, le texte en tranches sinon. D'un
 * tableur, le modèle ne lit que les onglets que le code n'a pas su lire.
 */
const readSource = (
  llm: PipelineLlm,
  document: ReadDocument,
  disabledFields: DisableableField[]
): Result<ReadSource, ReadingError> => {
  const tome = detectDocumentTome(document);
  if (tome.verdict === 'wrong_tome') {
    return failure({
      kind: 'wrong_document_tome',
      tome: tome.tome,
      evidence: tome.evidence,
    });
  }
  const { workbook } = document;
  const analysis = workbook
    ? analyzeWorkbook(workbook, { disabledFields })
    : null;
  // Les fiches lues par le code passent encore par les secteurs et la
  // revue : le garde-fou de coût les compte comme des unités.
  if (analysis && analysis.actions.length > MAX_DOCUMENT_UNITS) {
    return failure({
      kind: 'document_too_long',
      chunks: analysis.actions.length,
      maxChunks: MAX_DOCUMENT_UNITS,
    });
  }
  const modelDocument: ReadDocument = analysis
    ? { ...document, pages: analysis.modelPages }
    : document;
  const tabularRowGroups =
    isTabularKind(document.kind) &&
    hasMergedRowGroups(
      analysis && workbook
        ? analysis.modelPages.map(({ index }) => workbook[index])
        : workbook ?? []
    );
  if (llm.capabilities.strategy === 'segmented') {
    const units = segmentDocument(modelDocument);
    const total = units.length + (analysis?.actions.length ?? 0);
    if (total > MAX_DOCUMENT_UNITS) {
      return failure({
        kind: 'document_too_long',
        chunks: total,
        maxChunks: MAX_DOCUMENT_UNITS,
      });
    }
    return success({ chunks: [], units, analysis, tabularRowGroups });
  }
  const text = joinPages(modelDocument);
  const chunks =
    text.trim() === ''
      ? []
      : splitDocument(text, {
          maxTokens: llm.maxInputTokens,
          overlapTokens: CHUNK_OVERLAP_TOKENS,
          // Un classeur s'ouvre sur le nom de son premier onglet, qui ne vaut
          // pas pour les tranches suivantes : seul un CSV a un en-tête à répéter.
          header:
            isTabularKind(document.kind) && !modelDocument.pages[0]?.label
              ? text.split('\n', 1)[0]
              : undefined,
        });
  if (chunks.length > MAX_DOCUMENT_CHUNKS) {
    return failure({
      kind: 'document_too_long',
      chunks: chunks.length,
      maxChunks: MAX_DOCUMENT_CHUNKS,
    });
  }
  return success({ chunks, units: null, analysis, tabularRowGroups });
};

const describeReading = ({
  chunks,
  units,
  analysis,
}: ReadSource): Record<string, number> => {
  const countSheets = (...roles: SheetRole[]) =>
    analysis?.sheets.filter(({ role }) => roles.includes(role)).length ?? 0;
  return {
    ...(units ? { units: units.length } : { chunks: chunks.length }),
    ...(analysis && {
      planSheets: countSheets('plan'),
      complementSheets: countSheets('complement'),
      ignoredSheets: countSheets('synthese', 'liste', 'masque'),
      tabularActions: analysis.actions.length,
    }),
  };
};

const readingWarnings = (
  analysis: WorkbookAnalysis,
  { instructions, withVerifications }: RunImportPipelineInput
): string[] => {
  const planSheets = analysis.sheets
    .filter(({ role }) => role === 'plan')
    .map(({ name }) => (name === '' ? 'le fichier CSV' : `« ${name} »`));
  const ignored = [
    ...(instructions.trim() !== '' ? ['les consignes'] : []),
    ...(withVerifications ? ['les vérifications'] : []),
  ];
  return analysis.actions.length > 0 && ignored.length > 0
    ? [
        ...analysis.warnings,
        `${upperFirst(ignored.join(' et '))} ne s'appliquent pas aux ${
          analysis.actions.length
        } fiches lues sans le modèle (${planSheets.join(', ')}).`,
      ]
    : analysis.warnings;
};

/** Les tranches du modèle à la suite de celles des actions lues par le code. */
const appendSource = (
  source: SourceChunks,
  tabularActions: ExtractedAction[],
  extracted: SourceChunks
): SourceChunks => {
  if (tabularActions.length === 0) {
    return extracted;
  }
  return {
    chunks: [...source.chunks, ...extracted.chunks],
    chunkIndexByAction: [
      ...source.chunkIndexByAction,
      ...extracted.chunkIndexByAction.map(
        (index) => index + source.chunks.length
      ),
    ],
  };
};

/** Des onglets confiés au modèle sans action : les fiches lues par le code suffisent. */
const withTabularActions = (
  result: { success: false; error: ExtractActionsError },
  tabularActions: ExtractedAction[]
): Result<StepProduce, PipelineError> =>
  result.error.kind === 'no_actions_extracted' && tabularActions.length > 0
    ? success({
        actions: tabularActions,
        tokens: emptyTokenUsage(),
        warnings: [
          "Aucune action trouvée par le modèle dans les onglets qu'il a lus.",
        ],
      })
    : result;

const clearSousActions = (progress: Progress): Progress => ({
  ...progress,
  actions: progress.actions.map((action) => ({ ...action, sousActions: [] })),
});

const failed = (
  progress: Progress,
  failedStep: StepName,
  error: PipelineError
): PipelineOutcome => ({
  status: 'failed',
  failedStep,
  error,
  partialDraft: {
    actions: progress.actions,
    qualitativeReview: progress.review,
  },
  warnings: progress.warnings,
  stepStates: progress.stepStates,
  tokens: progress.tokens,
});

const done = (progress: Progress): PipelineOutcome => ({
  status: 'done',
  draft: { actions: progress.actions, qualitativeReview: progress.review },
  warnings: progress.warnings,
  stepStates: progress.stepStates,
  tokens: progress.tokens,
});

export const initialStepStates = (): StepStates => ({
  reading: 'pending',
  scouting: 'pending',
  extraction: 'pending',
  hierarchy: 'pending',
  scoring: 'pending',
  consolidation: 'pending',
  enrichment: 'pending',
  secteurs: 'pending',
  qualitativeReview: 'pending',
});

const initialProgress = (): Progress => ({
  actions: [],
  review: null,
  tokens: emptyTokenUsage(),
  stepStates: initialStepStates(),
  warnings: [],
});
