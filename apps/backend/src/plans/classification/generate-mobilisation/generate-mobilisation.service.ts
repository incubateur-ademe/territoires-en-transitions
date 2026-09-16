import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { sumTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Enjeu } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { ClassificationVoletsJobRepository } from '../classification-volets-job.repository';
import { CollectiviteVoletGesRepository } from '../collectivite-volet-ges.repository';
import { GridRepository, ScoredLevier } from '../grid.repository';
import { type AnalysisError } from '../models/analysis-error';
import { ClassificationOutcome } from '../models/classification-outcome';
import {
  CLASSIFICATION_DEADLINE_MS,
  ClassificationVoletsJob,
} from '../models/classification-volets-job';
import { calculateMobilisation } from '../pipeline/calculate-mobilisation/calculate-mobilisation';
import { groupVoletsByLevier } from '../pipeline/calculate-mobilisation/group-volets-by-levier';

export const LEVIERS_IN_PARALLEL = 5;

type PersistFailure = { step: 'replace_grid' | 'mark_done'; cause: string };

@Injectable()
export class GenerateMobilisationService {
  private readonly logger = new Logger(GenerateMobilisationService.name);

  constructor(
    private readonly jobRepository: ClassificationVoletsJobRepository,
    private readonly collectiviteVoletGesRepository: CollectiviteVoletGesRepository,
    private readonly collectivitesService: CollectivitesService,
    private readonly llm: LlmService,
    private readonly transactionManager: TransactionManager
  ) {}

  private readonly gridsByEnjeu: Record<Enjeu, GridRepository> = {
    ges: this.collectiviteVoletGesRepository,
  };

  async score(
    job: ClassificationVoletsJob,
    { fiches, volets, tokens: classificationTokens }: ClassificationOutcome
  ): Promise<Result<undefined, AnalysisError>> {
    const jobId = job.id;
    const gridRepository = this.gridsByEnjeu[job.enjeu];

    const collectivite = await this.readCollectivite(job.collectiviteId);
    if (!collectivite) {
      return this.interrupt(
        jobId,
        `La collectivité ${job.collectiviteId} est introuvable.`
      );
    }

    const leviersVolets = groupVoletsByLevier(volets);
    if (leviersVolets.length === 0) {
      return this.interrupt(
        jobId,
        "La classification n'a rattaché aucune action à un levier : il n'y a rien à évaluer."
      );
    }

    const phaseResult = await this.jobRepository.startMobilisationPhase(
      jobId,
      leviersVolets.length
    );
    if (!phaseResult.success) {
      return failure({
        kind: 'transition_failed',
        jobId,
        cause: phaseResult.error,
      });
    }

    const fichesById = new Map(fiches.map((fiche) => [fiche.ficheId, fiche]));

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
    const tokens = sumTokenUsage([
      classificationTokens,
      ...outcomes.flatMap((outcome) =>
        outcome.success ? [outcome.data.tokens] : []
      ),
    ]);

    const persistResult = await this.transactionManager.executeSingle<
      undefined,
      PersistFailure
    >(async (tx) => {
      const gridResult = await gridRepository.replaceGrid({
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
  ): Promise<Result<never, AnalysisError>> {
    const failedResult = await this.jobRepository.markFailed(jobId, message);
    if (!failedResult.success) {
      this.logger.error(
        `Enregistrement de l'échec du job ${jobId} impossible (${failedResult.error})`
      );
    }
    return failure({ kind: 'interrupted', jobId, message });
  }
}
