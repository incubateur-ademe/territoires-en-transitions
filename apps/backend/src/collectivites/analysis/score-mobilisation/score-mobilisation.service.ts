import { Injectable, NotFoundException } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Collectivite } from '@tet/domain/collectivites';
import { match } from 'ts-pattern';
import { LevierMobilisation } from '../mobilisation.repository';
import { calculateMobilisation } from '../pipeline/calculate-mobilisation/calculate-mobilisation';
import { groupVoletsByLevier } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { CalculateCollectiviteMobilisationError } from './score-mobilisation.errors';
import { CalculateCollectiviteMobilisationInput } from './score-mobilisation.input';

const LEVIERS_IN_PARALLEL = 5;

export type MobilisationScore = {
  leviers: LevierMobilisation[];
};

@Injectable()
export class ScoreMobilisationService {
  constructor(
    private readonly collectivitesService: CollectivitesService,
    private readonly llm: LlmService
  ) {}

  async calculateCollectiviteMobilisation({
    enjeu,
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

    return match(enjeu)
      .with('ges', () =>
        this.calculateGesMobilisation({
          collectiviteId,
          collectivite,
          volets,
          fiches,
        })
      )
      .exhaustive();
  }

  private async calculateGesMobilisation({
    collectiviteId,
    collectivite,
    volets,
    fiches,
  }: Omit<CalculateCollectiviteMobilisationInput, 'enjeu'> & {
    collectivite: Pick<Collectivite, 'nom' | 'population'>;
  }): Promise<
    Result<MobilisationScore, CalculateCollectiviteMobilisationError>
  > {
    const fichesById = new Map(fiches.map((fiche) => [fiche.ficheId, fiche]));
    const voletsOfKnownFiches = volets.filter(({ ficheId }) =>
      fichesById.has(ficheId)
    );

    const outcomes = await mapWithConcurrency(
      groupVoletsByLevier(voletsOfKnownFiches),
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
  ): Promise<Pick<Collectivite, 'nom' | 'population'> | undefined> {
    try {
      const { collectivite } = await this.collectivitesService.getCollectivite(
        collectiviteId
      );
      return collectivite;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return undefined;
      }
      throw error;
    }
  }
}
