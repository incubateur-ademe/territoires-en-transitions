import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { sumTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Enjeu } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { AnalysisJobRepository } from '../analysis-job.repository';
import { CollectiviteVoletGesRepository } from '../collectivite-volet-ges.repository';
import {
  MobilisationRepository,
  LevierMobilisation,
} from '../mobilisation.repository';
import { type AnalysisError } from '../models/analysis.errors';
import { ClassificationOutcome } from '../models/classification-outcome';
import {
  CLASSIFICATION_DEADLINE_MS,
  AnalysisJob,
} from '../models/analysis-job';
import { calculateMobilisation } from '../pipeline/calculate-mobilisation/calculate-mobilisation';
import { groupVoletsByLevier } from '../pipeline/calculate-mobilisation/group-volets-by-levier';

export const LEVIERS_IN_PARALLEL = 5;

export type MobilisationScore = {
  leviers: LevierMobilisation[];
  tokens: TokenUsage;
};

@Injectable()
export class ScoreMobilisationService {
  private readonly logger = new Logger(ScoreMobilisationService.name);

  constructor(
    private readonly jobRepository: AnalysisJobRepository,
    private readonly collectiviteVoletGesRepository: CollectiviteVoletGesRepository,
    private readonly collectivitesService: CollectivitesService,
    private readonly llm: LlmService
  ) {}

  private readonly mobilisationsByEnjeu: Record<Enjeu, MobilisationRepository> =
    {
      ges: this.collectiviteVoletGesRepository,
    };

  async score(
    job: AnalysisJob,
    { fiches, volets, tokens: classificationTokens }: ClassificationOutcome
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

    const scored = outcomes.flatMap((outcome) =>
      outcome.success ? [outcome.data] : []
    );
    const failedLeviers = outcomes.length - scored.length;
    if (failedLeviers > 0) {
      return this.interrupt(
        jobId,
        `Mobilisation abandonnée : ${failedLeviers} levier(s) en échec sur ${outcomes.length}. Aucune écriture n'a eu lieu.`
      );
    }

    return success({
      leviers: scored.map(({ levierId, volets: scoredVolets }) => ({
        levierId,
        volets: scoredVolets,
      })),
      tokens: sumTokenUsage([
        classificationTokens,
        ...scored.map(({ tokens }) => tokens),
      ]),
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
