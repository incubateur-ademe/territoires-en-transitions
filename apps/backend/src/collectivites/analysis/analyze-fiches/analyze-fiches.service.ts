import { Injectable, Logger } from '@nestjs/common';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Enjeu } from '@tet/domain/shared';
import { chunk, uniq } from 'es-toolkit';
import { ClassifyFicheFailure } from '../classify-fiche/classify-fiche.errors';
import { ClassifyFicheService } from '../classify-fiche/classify-fiche.service';
import { describeClassifyFicheFailure } from '../classify-fiche/describe-classify-fiche-failure.rules';
import { EnjeuRepositories } from '../enjeu.repositories';
import { AnalysisRunPlan, FicheCandidate } from '../models/fiche-analysis';
import { FicheToClassify } from '../pipeline/classify-fiche/render-fiche-text';
import { ClassifiedFiche } from '../pipeline/classify-fiche/to-classified-fiche.rules';
import { CalculateCollectiviteMobilisationError } from '../score-mobilisation/score-mobilisation.errors';
import { CalculateCollectiviteMobilisationInput } from '../score-mobilisation/score-mobilisation.input';
import {
  MobilisationScore,
  ScoreMobilisationService,
} from '../score-mobilisation/score-mobilisation.service';
import { addRunFailures, RunFailure } from './add-run-failures.rules';
import { AnalysisRunRepository } from './analysis-run.repository';
import { buildAnalysisRunPlan } from './build-analysis-run-plan.rules';
import { calculateFicheFingerprint } from './calculate-fiche-fingerprint.rules';
import { describeMobilisationFailure } from './describe-run-aborted.rules';
import { AnalyzeFichesError } from './analyze-fiches.errors';
import { AnalyzedCollectivites } from './analyzed-collectivites';
import { AnalyzeFichesInput } from './analyze-fiches.input';
import { AnalyzeFichesOutput } from './analyze-fiches.output';
import {
  FicheAnalysisStatusRepository,
  FicheAnalysisUpsert,
} from './fiche-analysis-status.repository';
import {
  AxePath,
  FicheAxePathRepository,
} from './fiche-axe-path.repository';
import {
  FicheCandidateRepository,
  FicheCandidateSelection,
} from './fiche-candidate.repository';
import { FicheTextRepository } from './fiche-text.repository';
import { isMobilisationStale } from './is-mobilisation-stale.rules';

const CLASSIFICATION_BATCH_SIZE = 25;

const MAX_ATTEMPTS = 3;

type StepResult<Data> = Result<Data, AnalyzeFichesError>;

type RunProgress = {
  readonly failures: readonly RunFailure[];
  readonly output: AnalyzeFichesOutput;
};

type ToFicheSelection = (collectiviteId: number) => FicheCandidateSelection;

type FailedFiche = {
  readonly ficheId: number;
  readonly cause: ClassifyFicheFailure;
};

type AxePathsByFicheId = ReadonlyMap<number, readonly AxePath[]>;

type BatchClassification = {
  readonly classified: readonly ClassifiedFiche[];
  readonly failedFiches: readonly FailedFiche[];
};

type CollectiviteStep = {
  readonly enjeu: Enjeu;
  readonly collectiviteId: number;
  readonly progress: RunProgress;
};

type RunPosition = {
  readonly index: number;
  readonly total: number;
};

const formatRunPosition = ({ index, total }: RunPosition): string =>
  `${index + 1}/${total}`;

const describeScope = (scope: AnalyzeFichesInput['scope']): string => {
  if (scope.kind === 'daily') {
    return 'daily run';
  }
  if (scope.collectivites === 'all') {
    return 'manual run on every collectivite';
  }
  return `manual run on collectivites ${scope.collectivites.join(', ')}`;
};

const EMPTY_PROGRESS: RunProgress = {
  failures: [],
  output: {
    classifiedFicheIds: [],
    failedFicheIds: [],
    removedFicheIds: [],
    recalculatedCollectiviteIds: [],
    failedCollectiviteIds: [],
  },
};

const withOutput = (
  progress: RunProgress,
  added: Partial<AnalyzeFichesOutput>
): RunProgress => ({
  ...progress,
  output: {
    classifiedFicheIds: [
      ...progress.output.classifiedFicheIds,
      ...(added.classifiedFicheIds ?? []),
    ],
    failedFicheIds: [
      ...progress.output.failedFicheIds,
      ...(added.failedFicheIds ?? []),
    ],
    removedFicheIds: [
      ...progress.output.removedFicheIds,
      ...(added.removedFicheIds ?? []),
    ],
    recalculatedCollectiviteIds: [
      ...progress.output.recalculatedCollectiviteIds,
      ...(added.recalculatedCollectiviteIds ?? []),
    ],
    failedCollectiviteIds: [
      ...progress.output.failedCollectiviteIds,
      ...(added.failedCollectiviteIds ?? []),
    ],
  },
});

const everyFiche: ToFicheSelection = (collectiviteId) => ({
  kind: 'every_fiche',
  collectiviteId,
});

const toExplicitCollectiviteIds = (
  scope: AnalyzeFichesInput['scope']
): readonly number[] | undefined => {
  if (scope.kind === 'daily' || scope.collectivites === 'all') {
    return undefined;
  }
  return scope.collectivites;
};

const toFicheToClassify = (
  { ficheId, titre, description }: FicheCandidate,
  axePathsByFicheId: AxePathsByFicheId
): FicheToClassify => ({
  ficheId,
  titre,
  description,
  axePaths: axePathsByFicheId.get(ficheId) ?? [],
});

const isHealedByNewAttempt = (failure: ClassifyFicheFailure): boolean =>
  failure.kind === 'invalid_json' || failure.kind === 'truncated';

const toFicheIds = (fiches: readonly { ficheId: number }[]): number[] =>
  fiches.map(({ ficheId }) => ficheId);

@Injectable()
export class AnalyzeFichesService {
  private readonly logger = new Logger(AnalyzeFichesService.name);

  constructor(
    private readonly ficheCandidates: FicheCandidateRepository,
    private readonly ficheTexts: FicheTextRepository,
    private readonly ficheAxePaths: FicheAxePathRepository,
    private readonly ficheAnalyses: FicheAnalysisStatusRepository,
    private readonly analysisRuns: AnalysisRunRepository,
    private readonly enjeuRepositories: EnjeuRepositories,
    private readonly classifyFicheService: ClassifyFicheService,
    private readonly scoreMobilisationService: ScoreMobilisationService,
    private readonly analyzedCollectivites: AnalyzedCollectivites
  ) {}

  async analyzeFiches({
    enjeu,
    scope,
    startedAt,
  }: AnalyzeFichesInput): Promise<StepResult<AnalyzeFichesOutput>> {
    const selectionResult = await this.toFicheSelection(scope);
    if (!selectionResult.success) {
      return selectionResult;
    }
    const collectiviteIdsResult = await this.listCollectiviteIds({
      enjeu,
      scope,
    });
    if (!collectiviteIdsResult.success) {
      return collectiviteIdsResult;
    }
    const collectiviteIds = collectiviteIdsResult.data;
    this.logger.log(
      `Run started (${describeScope(scope)}): ${
        collectiviteIds.length
      } collectivite(s) to check`
    );

    const runResult = await collectiviteIds.reduce<
      Promise<StepResult<RunProgress>>
    >(async (previous, collectiviteId, index) => {
      const previousResult = await previous;
      if (!previousResult.success) {
        return previousResult;
      }
      return this.analyzeCollectivite({
        enjeu,
        collectiviteId,
        toSelection: selectionResult.data,
        progress: previousResult.data,
        position: { index, total: collectiviteIds.length },
      });
    }, Promise.resolve(success(EMPTY_PROGRESS)));
    if (!runResult.success) {
      return runResult;
    }
    if (scope.kind === 'daily') {
      const runCreationResult = await this.analysisRuns.createCompletedRun({
        startedAt,
      });
      if (!runCreationResult.success) {
        return failure({
          kind: 'step_failed',
          step: 'create_run',
          cause: runCreationResult.error,
        });
      }
    }
    const durationInSeconds = Math.round(
      (Date.now() - startedAt.getTime()) / 1000
    );
    this.logger.log(`Run finished in ${durationInSeconds}s`);
    return success(runResult.data.output);
  }

  private async toFicheSelection(
    scope: AnalyzeFichesInput['scope']
  ): Promise<StepResult<ToFicheSelection>> {
    if (scope.kind === 'collectivites') {
      return success(everyFiche);
    }
    const lastRunResult = await this.analysisRuns.getLastCompletedRunStart();
    if (!lastRunResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'get_last_run',
        cause: lastRunResult.error,
      });
    }
    const since = lastRunResult.data;
    if (since === null) {
      this.logger.log('No completed daily run yet: every fiche is read');
      return success(everyFiche);
    }
    this.logger.log(`Reading fiches pending since ${since.toISOString()}`);
    return success((collectiviteId) => ({
      kind: 'pending_since',
      collectiviteId,
      since,
    }));
  }

  private async listCollectiviteIds({
    enjeu,
    scope,
  }: Pick<AnalyzeFichesInput, 'enjeu' | 'scope'>): Promise<
    StepResult<number[]>
  > {
    const explicitCollectiviteIds = toExplicitCollectiviteIds(scope);
    if (explicitCollectiviteIds !== undefined) {
      return success([...explicitCollectiviteIds]);
    }
    const [candidatesResult, mobilisationsResult] = await Promise.all([
      this.ficheCandidates.listCollectivitesWithFicheCandidates(),
      this.enjeuRepositories
        .mobilisationOf(enjeu)
        .listCollectivitesWithMobilisation(),
    ]);
    if (!candidatesResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'list_collectivites_with_fiche_candidates',
        cause: candidatesResult.error,
      });
    }
    if (!mobilisationsResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'list_collectivites_with_mobilisation',
        cause: mobilisationsResult.error,
      });
    }
    const collectiviteIds = uniq([
      ...candidatesResult.data,
      ...mobilisationsResult.data,
    ]).toSorted((a, b) => a - b);
    return success(
      collectiviteIds.filter((collectiviteId) =>
        this.analyzedCollectivites.has(collectiviteId)
      )
    );
  }

  private async analyzeCollectivite({
    enjeu,
    collectiviteId,
    toSelection,
    progress,
    position,
  }: CollectiviteStep & {
    readonly toSelection: ToFicheSelection;
    readonly position: RunPosition;
  }): Promise<StepResult<RunProgress>> {
    const fichesResult = await this.ficheCandidates.listFicheCandidates(
      toSelection(collectiviteId)
    );
    if (!fichesResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'list_fiche_candidates',
        cause: fichesResult.error,
      });
    }
    const analysesResult = await this.ficheAnalyses.listAnalyses({
      collectiviteId,
    });
    if (!analysesResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'list_analyses',
        cause: analysesResult.error,
      });
    }
    const plan = buildAnalysisRunPlan({
      fiches: fichesResult.data,
      analyses: analysesResult.data,
    });
    this.logger.log(
      `Collectivite ${formatRunPosition(position)} (id ${collectiviteId}): ${
        fichesResult.data.length
      } fiche(s) read, ${plan.toClassify.length} to classify (${
        plan.toMarkStale.length
      } stale), ${plan.toRemove.length} to remove`
    );

    const preparationResult = await this.prepareFiches({
      enjeu,
      collectiviteId,
      plan,
    });
    if (!preparationResult.success) {
      return preparationResult;
    }
    const classificationResult = await this.classifyInBatches({
      enjeu,
      collectiviteId,
      fiches: plan.toClassify,
      progress: withOutput(progress, {
        removedFicheIds: toFicheIds(plan.toRemove),
      }),
    });
    if (!classificationResult.success) {
      return classificationResult;
    }
    return this.checkMobilisation({
      enjeu,
      collectiviteId,
      progress: classificationResult.data,
    });
  }

  private async prepareFiches({
    enjeu,
    collectiviteId,
    plan,
  }: Omit<CollectiviteStep, 'progress'> & {
    readonly plan: AnalysisRunPlan;
  }): Promise<StepResult<void>> {
    if (plan.toMarkStale.length > 0) {
      const staleResult = await this.ficheAnalyses.upsertAnalyses({
        analyses: plan.toMarkStale.map(
          ({ ficheId }): FicheAnalysisUpsert => ({
            ficheId,
            collectiviteId,
            status: 'stale',
          })
        ),
      });
      if (!staleResult.success) {
        return failure({
          kind: 'step_failed',
          step: 'upsert_analyses',
          cause: staleResult.error,
        });
      }
    }
    if (plan.toRemove.length === 0) {
      return success(undefined);
    }
    const removedFicheIds = toFicheIds(plan.toRemove);
    const voletsDeletionResult = await this.enjeuRepositories
      .voletsOf(enjeu)
      .deleteVolets({ ficheIds: removedFicheIds });
    if (!voletsDeletionResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'delete_volets',
        cause: voletsDeletionResult.error,
      });
    }
    const analysesDeletionResult = await this.ficheAnalyses.deleteAnalyses({
      ficheIds: removedFicheIds,
    });
    if (!analysesDeletionResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'delete_analyses',
        cause: analysesDeletionResult.error,
      });
    }
    return success(undefined);
  }

  private async classifyInBatches({
    enjeu,
    collectiviteId,
    fiches,
    progress,
  }: CollectiviteStep & {
    readonly fiches: readonly FicheCandidate[];
  }): Promise<StepResult<RunProgress>> {
    if (fiches.length === 0) {
      return success(progress);
    }
    const axePathsResult = await this.ficheAxePaths.listFicheAxePaths({
      ficheIds: toFicheIds(fiches),
    });
    if (!axePathsResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'list_fiche_axe_paths',
        cause: axePathsResult.error,
      });
    }
    const axePathsByFicheId: AxePathsByFicheId = new Map(
      axePathsResult.data.map(({ ficheId, axePaths }) => [ficheId, axePaths])
    );
    const batches = chunk([...fiches], CLASSIFICATION_BATCH_SIZE);
    return batches.reduce<Promise<StepResult<RunProgress>>>(
      async (previous, batch, index) => {
        const previousResult = await previous;
        if (!previousResult.success) {
          return previousResult;
        }
        return this.classifyBatch({
          enjeu,
          collectiviteId,
          batch,
          axePathsByFicheId,
          progress: previousResult.data,
          position: { index, total: batches.length },
        });
      },
      Promise.resolve(success(progress))
    );
  }

  private async classifyBatch({
    enjeu,
    collectiviteId,
    batch,
    axePathsByFicheId,
    progress,
    position,
  }: CollectiviteStep & {
    readonly batch: readonly FicheCandidate[];
    readonly axePathsByFicheId: AxePathsByFicheId;
    readonly position: RunPosition;
  }): Promise<StepResult<RunProgress>> {
    const results = await Promise.all(
      batch.map((fiche) =>
        this.classifyWithRetries({
          enjeu,
          collectiviteId,
          position,
          fiche: toFicheToClassify(fiche, axePathsByFicheId),
          attempt: 1,
        })
      )
    );
    const classified = results.flatMap((result) =>
      result.success ? [result.data] : []
    );
    const failedFiches = results.flatMap((result, index): FailedFiche[] =>
      result.success
        ? []
        : [{ ficheId: batch[index].ficheId, cause: result.error }]
    );
    this.logger.log(
      `Collectivite ${collectiviteId}, batch ${formatRunPosition(position)}: ${
        classified.length
      } classified, ${failedFiches.length} failed`
    );
    const writeResult = await this.writeClassification({
      enjeu,
      collectiviteId,
      batch,
      classification: { classified, failedFiches },
    });
    if (!writeResult.success) {
      return writeResult;
    }
    const failuresResult = addRunFailures(
      progress.failures,
      failedFiches.map(
        ({ ficheId, cause }): RunFailure => ({
          kind: 'fiche',
          ficheId,
          collectiviteId,
          cause,
        })
      )
    );
    if (!failuresResult.success) {
      return failuresResult;
    }
    this.logRunFailures({
      previousCount: progress.failures.length,
      currentCount: failuresResult.data.length,
    });
    return success(
      withOutput(
        { ...progress, failures: failuresResult.data },
        {
          classifiedFicheIds: toFicheIds(classified),
          failedFicheIds: toFicheIds(failedFiches),
        }
      )
    );
  }

  private async classifyWithRetries({
    enjeu,
    collectiviteId,
    position,
    fiche,
    attempt,
  }: Omit<CollectiviteStep, 'progress'> & {
    readonly position: RunPosition;
    readonly fiche: FicheToClassify;
    readonly attempt: number;
  }): Promise<Result<ClassifiedFiche, ClassifyFicheFailure>> {
    const classificationResult = await this.classifyFicheService.classify({
      enjeu,
      fiche,
    });
    if (classificationResult.success) {
      return success(classificationResult.data.fiche);
    }
    this.logger.warn(
      `Collectivite ${collectiviteId}, batch ${formatRunPosition(
        position
      )}: classification of fiche ${fiche.ficheId} failed (${describeClassifyFicheFailure(
        classificationResult.error
      )}), attempt ${attempt}/${MAX_ATTEMPTS}`
    );
    const isRetryable =
      isHealedByNewAttempt(classificationResult.error) &&
      attempt < MAX_ATTEMPTS;
    if (!isRetryable) {
      return failure(classificationResult.error);
    }
    return this.classifyWithRetries({
      enjeu,
      collectiviteId,
      position,
      fiche,
      attempt: attempt + 1,
    });
  }

  private async writeClassification({
    enjeu,
    collectiviteId,
    batch,
    classification,
  }: Omit<CollectiviteStep, 'progress'> & {
    readonly batch: readonly FicheCandidate[];
    readonly classification: BatchClassification;
  }): Promise<StepResult<void>> {
    const { classified, failedFiches } = classification;
    if (classified.length > 0) {
      const voletsSavingResult = await this.enjeuRepositories
        .voletsOf(enjeu)
        .saveVolets({
          collectiviteId,
          fiches: classified.map(({ ficheId, volets }) => ({
            ficheId,
            volets,
          })),
        });
      if (!voletsSavingResult.success) {
        return failure({
          kind: 'step_failed',
          step: 'save_volets',
          cause: voletsSavingResult.error,
        });
      }
    }
    const fichesById = new Map(batch.map((fiche) => [fiche.ficheId, fiche]));
    const analyses = [
      ...classified.flatMap(({ ficheId }): FicheAnalysisUpsert[] => {
        const fiche = fichesById.get(ficheId);
        if (fiche === undefined) {
          return [];
        }
        return [
          {
            ficheId,
            collectiviteId,
            status: 'processed',
            fingerprint: calculateFicheFingerprint(fiche),
          },
        ];
      }),
      ...failedFiches.map(
        ({ ficheId }): FicheAnalysisUpsert => ({
          ficheId,
          collectiviteId,
          status: 'failed',
        })
      ),
    ];
    if (analyses.length === 0) {
      return success(undefined);
    }
    const analysesWritingResult = await this.ficheAnalyses.upsertAnalyses({
      analyses,
    });
    if (!analysesWritingResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'upsert_analyses',
        cause: analysesWritingResult.error,
      });
    }
    return success(undefined);
  }

  private async checkMobilisation({
    enjeu,
    collectiviteId,
    progress,
  }: CollectiviteStep): Promise<StepResult<RunProgress>> {
    const mobilisationRepository = this.enjeuRepositories.mobilisationOf(enjeu);
    const analysesResult = await this.ficheAnalyses.listAnalyses({
      collectiviteId,
    });
    if (!analysesResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'list_analyses',
        cause: analysesResult.error,
      });
    }
    const stateResult = await mobilisationRepository.getMobilisationState({
      collectiviteId,
    });
    if (!stateResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'get_mobilisation_state',
        cause: stateResult.error,
      });
    }
    const isStale = isMobilisationStale({
      mobilisation: stateResult.data,
      analyses: analysesResult.data,
    });
    if (!isStale) {
      this.logger.log(
        `Collectivite ${collectiviteId}: mobilisation up to date`
      );
      return success(progress);
    }

    const scoringInputResult = await this.readScoringInput({
      enjeu,
      collectiviteId,
    });
    if (!scoringInputResult.success) {
      return scoringInputResult;
    }
    const scoreResult = await this.scoreWithRetries(scoringInputResult.data, 1);
    if (!scoreResult.success) {
      this.logger.warn(
        `Collectivite ${collectiviteId}: mobilisation failed after ${MAX_ATTEMPTS} attempts (${describeMobilisationFailure(
          scoreResult.error
        )})`
      );
      const failuresResult = addRunFailures(progress.failures, [
        { kind: 'mobilisation', collectiviteId, cause: scoreResult.error },
      ]);
      if (!failuresResult.success) {
        return failuresResult;
      }
      this.logRunFailures({
        previousCount: progress.failures.length,
        currentCount: failuresResult.data.length,
      });
      return success(
        withOutput(
          { ...progress, failures: failuresResult.data },
          { failedCollectiviteIds: [collectiviteId] }
        )
      );
    }
    const updateResult = await mobilisationRepository.updateMobilisation({
      collectiviteId,
      leviers: scoreResult.data.leviers,
    });
    if (!updateResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'update_mobilisation',
        cause: updateResult.error,
      });
    }
    this.logger.log(
      `Collectivite ${collectiviteId}: mobilisation recalculated (${scoreResult.data.leviers.length} levier(s))`
    );
    return success(
      withOutput(progress, { recalculatedCollectiviteIds: [collectiviteId] })
    );
  }

  private logRunFailures({
    previousCount,
    currentCount,
  }: {
    readonly previousCount: number;
    readonly currentCount: number;
  }): void {
    const hasNewFailures = currentCount > previousCount;
    if (!hasNewFailures) {
      return;
    }
    this.logger.warn(`${currentCount} definitive failure(s) in this run`);
  }

  private async readScoringInput({
    enjeu,
    collectiviteId,
  }: Omit<CollectiviteStep, 'progress'>): Promise<
    StepResult<CalculateCollectiviteMobilisationInput>
  > {
    const voletsResult = await this.enjeuRepositories
      .voletsOf(enjeu)
      .listVolets({ collectiviteId });
    if (!voletsResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'list_volets',
        cause: voletsResult.error,
      });
    }
    const textsResult = await this.ficheTexts.listFicheTexts({
      ficheIds: uniq(toFicheIds(voletsResult.data)),
    });
    if (!textsResult.success) {
      return failure({
        kind: 'step_failed',
        step: 'list_fiche_texts',
        cause: textsResult.error,
      });
    }
    return success({
      enjeu,
      collectiviteId,
      volets: voletsResult.data,
      fiches: textsResult.data,
    });
  }

  private async scoreWithRetries(
    input: CalculateCollectiviteMobilisationInput,
    attempt: number
  ): Promise<
    Result<MobilisationScore, CalculateCollectiviteMobilisationError>
  > {
    const scoreResult =
      await this.scoreMobilisationService.calculateCollectiviteMobilisation(
        input
      );
    const isRetryOver = scoreResult.success || attempt >= MAX_ATTEMPTS;
    if (isRetryOver) {
      return scoreResult;
    }
    return this.scoreWithRetries(input, attempt + 1);
  }
}
