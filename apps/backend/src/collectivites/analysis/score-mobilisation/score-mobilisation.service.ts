import { Injectable, NotFoundException } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { LevierMobilisation } from '../mobilisation.repository';
import { calculateMobilisation } from '../pipeline/calculate-mobilisation/calculate-mobilisation';
import { groupVoletsByLevier } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { CalculateCollectiviteMobilisationError } from './score-mobilisation.errors';
import { CalculateCollectiviteMobilisationInput } from './score-mobilisation.input';

const LEVIERS_IN_PARALLEL = 5;

export type MobilisationScore = {
  leviers: LevierMobilisation[];
};

type CollectiviteForPrompt = { nom: string; population: number | null };

@Injectable()
export class ScoreMobilisationService {
  constructor(
    private readonly collectivitesService: CollectivitesService,
    private readonly llm: LlmService
  ) {}

  async calculateCollectiviteMobilisation({
    collectiviteId,
    volets,
    fiches,
  }: CalculateCollectiviteMobilisationInput): Promise<
    Result<MobilisationScore, CalculateCollectiviteMobilisationError>
  > {
    const collectivite = await this.readCollectivite(collectiviteId);
    if (!collectivite) {
      return failure({ kind: 'collectivite_not_found', collectiviteId });
    }

    const fichesById = new Map(fiches.map((fiche) => [fiche.ficheId, fiche]));

    const outcomes = await mapWithConcurrency(
      groupVoletsByLevier(volets),
      LEVIERS_IN_PARALLEL,
      async (levierVolets) => ({
        levierId: levierVolets.levierId,
        scoring: await calculateMobilisation(this.llm, {
          levierVolets,
          fichesById,
          collectiviteNom: collectivite.nom,
          population: collectivite.population,
        }),
      })
    );

    const unscored = outcomes.flatMap(({ levierId, scoring }) =>
      scoring.success ? [] : [{ levierId, kind: scoring.error.kind }]
    );
    if (unscored.length > 0) {
      return failure({ kind: 'leviers_not_scored', collectiviteId, unscored });
    }

    return success({
      leviers: outcomes.flatMap(({ scoring }) =>
        scoring.success
          ? [{ levierId: scoring.data.levierId, volets: scoring.data.volets }]
          : []
      ),
    });
  }

  private async readCollectivite(
    collectiviteId: number
  ): Promise<CollectiviteForPrompt | undefined> {
    try {
      const { nom, population } =
        await this.collectivitesService.getCollectiviteAvecType(collectiviteId);
      return { nom, population };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return undefined;
      }
      throw error;
    }
  }
}
