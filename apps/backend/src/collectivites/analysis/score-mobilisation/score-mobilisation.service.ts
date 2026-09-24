import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { notImplemented } from '@tet/backend/utils/not-implemented';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { AnalysisJobRepository } from '../analysis-job.repository';
import { LevierMobilisation } from '../mobilisation.repository';
import { type AnalysisError } from '../models/analysis.errors';
import { ClassificationOutcome } from '../models/classification-outcome';
import {
  AnalysisJob,
  toAnalysisDeadlineFrom,
  toDeadlineSignal,
} from '../models/analysis-job';
import { calculateMobilisation } from '../pipeline/calculate-mobilisation/calculate-mobilisation';
import { groupVoletsByLevier } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import {
  CalculateCollectiviteMobilisationError,
  UnscoredLevier,
} from './score-mobilisation.errors';
import { CalculateCollectiviteMobilisationInput } from './score-mobilisation.input';

export const LEVIERS_IN_PARALLEL = 5;

export type MobilisationScore = {
  leviers: LevierMobilisation[];
};

type CalculateCollectiviteMobilisation = (
  input: CalculateCollectiviteMobilisationInput
) => Promise<Result<MobilisationScore, CalculateCollectiviteMobilisationError>>;

const toUnscoredLeviersWithCause = (unscored: UnscoredLevier[]): string =>
  unscored
    .map(({ levierId, kind }) => `${LEVIER_NOM_BY_ID[levierId]} (${kind})`)
    .join(', ');

@Injectable()
export class ScoreMobilisationService {
  private readonly logger = new Logger(ScoreMobilisationService.name);

  constructor(
    private readonly jobRepository: AnalysisJobRepository,
    private readonly collectivitesService: CollectivitesService,
    private readonly llm: LlmService
  ) {}

  calculateCollectiviteMobilisation: CalculateCollectiviteMobilisation =
    notImplemented('calculateCollectiviteMobilisation');

  async score(
    job: AnalysisJob,
    { fiches, volets }: ClassificationOutcome
  ): Promise<Result<MobilisationScore, AnalysisError>> {
    const jobId = job.id;

    const collectivite = await this.readCollectivite(job.collectiviteId);
    if (!collectivite) {
      return this.interrupt(
        jobId,
        `La collectivité ${job.collectiviteId} est introuvable.`
      );
    }

    const leviersVolets = groupVoletsByLevier(volets);
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

    const deadlineSignal = toDeadlineSignal(
      toAnalysisDeadlineFrom(job.createdAt)
    );
    const outcomes = await mapWithConcurrency(
      leviersVolets,
      LEVIERS_IN_PARALLEL,
      async (levierVolets) => {
        const scoring = await calculateMobilisation(this.llm, {
          levierVolets,
          fichesById,
          collectiviteNom: collectivite.nom,
          population: collectivite.population,
          signal: deadlineSignal,
        });
        if (scoring.success) {
          await this.jobRepository.addTokenUsage(jobId, scoring.data.tokens);
        }
        return { levierId: levierVolets.levierId, scoring };
      },
      (processedLeviers) => {
        void this.jobRepository.recordProcessedBatches(jobId, processedLeviers);
      }
    );

    const scored = outcomes.flatMap(({ scoring }) =>
      scoring.success ? [scoring.data] : []
    );

    const unscored = outcomes.flatMap(({ levierId, scoring }) => {
      if (scoring.success) {
        return [];
      }
      return [{ levierId, kind: scoring.error.kind }];
    });
    if (unscored.length > 0) {
      return this.interrupt(
        jobId,
        `Mobilisation abandonnée : ${unscored.length} levier(s) en échec sur ${
          outcomes.length
        } — ${toUnscoredLeviersWithCause(
          unscored
        )}. Aucune écriture n'a eu lieu.`
      );
    }

    return success({
      leviers: scored.map(({ levierId, volets: scoredVolets }) => ({
        levierId,
        volets: scoredVolets,
      })),
    });
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
        `Could not read collectivite ${collectiviteId}: ${getErrorMessage(
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
        `Could not record failure of job ${jobId} (${failedResult.error})`
      );
    }
    return failure({ kind: 'interrupted', jobId, message });
  }
}
