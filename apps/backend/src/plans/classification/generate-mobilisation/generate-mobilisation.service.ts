import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { getErrorMessage } from '@tet/domain/utils';
import { ClassificationVoletsJobRepository } from '../classification-volets-job.repository';
import {
  CollectiviteVoletGesRepository,
  ScoredLevier,
} from '../collectivite-volet-ges.repository';
import { FicheActionVoletGesRepository } from '../fiche-action-volet-ges.repository';
import {
  CLASSIFICATION_DEADLINE_MS,
  ClassificationVoletsJobStatusEnum,
  FICHES_TO_CLASSIFY_FILTERS,
} from '../models/classification-volets-job';
import { calculateMobilisation } from '../pipeline/calculate-mobilisation/calculate-mobilisation';
import { groupVoletsByLevier } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { FicheToScore } from '../pipeline/calculate-mobilisation/render-volet-actions';

export const LEVIERS_IN_PARALLEL = 5;

export type GenerateMobilisationError =
  | { kind: 'job_unreadable'; jobId: string; cause: string }
  | { kind: 'transition_failed'; jobId: string; cause: string }
  | { kind: 'failure_record_failed'; jobId: string; cause: string }
  | { kind: 'interrupted'; jobId: string; message: string };

type PersistFailure = { step: 'replace_grid' | 'mark_done'; cause: string };

const sumTokens = (usages: TokenUsage[]): TokenUsage =>
  usages.reduce(
    (total, tokens) => ({
      promptTokens: total.promptTokens + tokens.promptTokens,
      candidatesTokens: total.candidatesTokens + tokens.candidatesTokens,
      thoughtsTokens: total.thoughtsTokens + tokens.thoughtsTokens,
      totalTokens: total.totalTokens + tokens.totalTokens,
    }),
    {
      promptTokens: 0,
      candidatesTokens: 0,
      thoughtsTokens: 0,
      totalTokens: 0,
    }
  );

@Injectable()
export class GenerateMobilisationService {
  private readonly logger = new Logger(GenerateMobilisationService.name);

  constructor(
    private readonly jobRepository: ClassificationVoletsJobRepository,
    private readonly listFichesService: ListFichesService,
    private readonly ficheVoletRepository: FicheActionVoletGesRepository,
    private readonly gridRepository: CollectiviteVoletGesRepository,
    private readonly collectivitesService: CollectivitesService,
    private readonly llm: LlmService,
    private readonly transactionManager: TransactionManager
  ) {}

  async generate(
    jobId: string
  ): Promise<Result<undefined, GenerateMobilisationError>> {
    const jobResult = await this.jobRepository.getById(jobId);
    if (!jobResult.success) {
      return failure({ kind: 'job_unreadable', jobId, cause: jobResult.error });
    }
    const job = jobResult.data;

    const isAlreadyDone = job.status === ClassificationVoletsJobStatusEnum.DONE;
    if (isAlreadyDone) {
      this.logger.log(`Job ${jobId} déjà terminé, ré-livraison ignorée`);
      return success(undefined);
    }

    const collectivite = await this.readCollectivite(job.collectiviteId);
    if (!collectivite) {
      return this.interrupt(
        jobId,
        `La collectivité ${job.collectiviteId} est introuvable.`
      );
    }

    const { data: readableFiches } =
      await this.listFichesService.getFichesActionResumes(
        {
          collectiviteId: job.collectiviteId,
          filters: FICHES_TO_CLASSIFY_FILTERS,
          queryOptions: { limit: 'all' },
        },
        { user: buildRequesterUser(job.createdBy) }
      );

    const ownedFiches = readableFiches.filter(
      ({ collectiviteId }) => collectiviteId === job.collectiviteId
    );

    const voletsResult = await this.ficheVoletRepository.listVoletsOfFiches(
      ownedFiches.map(({ id }) => id)
    );
    if (!voletsResult.success) {
      return this.interrupt(
        jobId,
        'La lecture des volets classés a échoué. Relancez la mobilisation.'
      );
    }

    const leviersVolets = groupVoletsByLevier(voletsResult.data);
    if (leviersVolets.length === 0) {
      return this.interrupt(
        jobId,
        "Aucun volet classé sur cette collectivité : lancez d'abord la classification."
      );
    }

    const runningResult = await this.jobRepository.markRunning(
      jobId,
      leviersVolets.length
    );
    if (!runningResult.success) {
      return failure({
        kind: 'transition_failed',
        jobId,
        cause: runningResult.error,
      });
    }

    const fichesById = new Map<number, FicheToScore>(
      ownedFiches.map(({ id, titre, description }) => [
        id,
        { ficheId: id, titre: titre ?? '', description },
      ])
    );

    const deadline = AbortSignal.timeout(CLASSIFICATION_DEADLINE_MS);
    const outcomes = await mapWithConcurrency(
      leviersVolets,
      LEVIERS_IN_PARALLEL,
      (levierVolets) =>
        calculateMobilisation(this.llm, {
          levierVolets,
          fichesById,
          collectiviteNom: collectivite.nom,
          population: collectivite.population,
          signal: deadline,
        }),
      (processedLeviers) => {
        void this.jobRepository.recordProcessedBatches(jobId, processedLeviers);
      }
    );

    const failedLeviers = outcomes.filter(({ success }) => !success).length;
    if (failedLeviers > 0) {
      return this.interrupt(
        jobId,
        `Mobilisation abandonnée : ${failedLeviers} levier(s) en échec sur ${leviersVolets.length}. La grille précédente est conservée.`
      );
    }

    const scoredLeviers = outcomes.flatMap<ScoredLevier>((outcome) =>
      outcome.success
        ? [{ levierId: outcome.data.levierId, volets: outcome.data.volets }]
        : []
    );
    const tokens = sumTokens(
      outcomes.flatMap((outcome) =>
        outcome.success ? [outcome.data.tokens] : []
      )
    );

    const persistResult = await this.transactionManager.executeSingle<
      undefined,
      PersistFailure
    >(async (tx) => {
      const gridResult = await this.gridRepository.replaceGrid({
        collectiviteId: job.collectiviteId,
        leviers: scoredLeviers,
        tx,
      });
      if (!gridResult.success) {
        return failure({
          step: 'replace_grid' as const,
          cause: gridResult.error,
        });
      }

      const doneResult = await this.jobRepository.markDone({
        id: jobId,
        tokenUsage: tokens,
        tx,
      });
      if (!doneResult.success) {
        return failure({ step: 'mark_done' as const, cause: doneResult.error });
      }

      return success(undefined);
    });

    if (persistResult.success) {
      return success(undefined);
    }

    return this.interrupt(
      jobId,
      `Écriture de la grille impossible (${persistResult.error.step}). La grille précédente est conservée.`
    );
  }

  async recordTerminalFailure(jobId: string, message: string): Promise<void> {
    const failedResult = await this.jobRepository.markFailed(jobId, message);
    if (!failedResult.success) {
      this.logger.error(
        `Enregistrement de l'échec du job ${jobId} impossible (${failedResult.error})`
      );
    }
  }

  private async readCollectivite(
    collectiviteId: number
  ): Promise<{ nom: string; population: number | null } | undefined> {
    try {
      const { nom, population } =
        await this.collectivitesService.getCollectiviteAvecType(collectiviteId);
      return { nom, population };
    } catch (error) {
      this.logger.error(
        `Lecture de la collectivité ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return undefined;
    }
  }

  private async interrupt(
    jobId: string,
    message: string
  ): Promise<Result<undefined, GenerateMobilisationError>> {
    const failedResult = await this.jobRepository.markFailed(jobId, message);
    if (!failedResult.success) {
      return failure({
        kind: 'failure_record_failed',
        jobId,
        cause: failedResult.error,
      });
    }
    return failure({ kind: 'interrupted', jobId, message });
  }
}
