import { Injectable } from '@nestjs/common';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { match } from 'ts-pattern';
import { LevierMobilisation } from '../mobilisation.repository';
import { calculateMobilisation } from '../pipeline/calculate-mobilisation/calculate-mobilisation';
import { groupVoletsByLevier } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import {
  CollectiviteIdentity,
  CollectiviteIdentityRepository,
} from './collectivite-identity.repository';
import { CalculateCollectiviteMobilisationError } from './score-mobilisation.errors';
import { CalculateCollectiviteMobilisationInput } from './score-mobilisation.input';

const LEVIERS_IN_PARALLEL = 5;

export type MobilisationScore = {
  leviers: LevierMobilisation[];
};

@Injectable()
export class ScoreMobilisationService {
  constructor(
    private readonly collectiviteIdentityRepository: CollectiviteIdentityRepository,
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
    const collectiviteResult = await this.readCollectivite(collectiviteId);
    if (!collectiviteResult.success) {
      return collectiviteResult;
    }

    return match(enjeu)
      .with('ges', () =>
        this.calculateGesMobilisation({
          collectiviteId,
          collectivite: collectiviteResult.data,
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
    collectivite: CollectiviteIdentity;
  }): Promise<
    Result<MobilisationScore, CalculateCollectiviteMobilisationError>
  > {
    const fichesById = new Map(fiches.map((fiche) => [fiche.ficheId, fiche]));
    const voletsOfKnownFiches = volets.filter(({ ficheId }) =>
      fichesById.has(ficheId)
    );

    const levierScorings = await mapWithConcurrency(
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

    const unscored = levierScorings.flatMap(({ levierId, scoring }) => {
      if (scoring.success) {
        return [];
      }
      return [{ levierId, kind: scoring.error.kind }];
    });
    if (unscored.length > 0) {
      return failure({ kind: 'leviers_not_scored', collectiviteId, unscored });
    }

    return success({
      leviers: levierScorings.flatMap(({ scoring }) => {
        if (!scoring.success) {
          return [];
        }
        const { levierId, volets: scoredVolets } = scoring.data;
        return [{ levierId, volets: scoredVolets }];
      }),
    });
  }

  private async readCollectivite(
    collectiviteId: number
  ): Promise<
    Result<CollectiviteIdentity, CalculateCollectiviteMobilisationError>
  > {
    const identityResult =
      await this.collectiviteIdentityRepository.getCollectiviteIdentity({
        collectiviteId,
      });
    if (identityResult.success) {
      return identityResult;
    }
    const mobilisationError = match(identityResult.error)
      .with(
        'COLLECTIVITE_NOT_FOUND',
        (): CalculateCollectiviteMobilisationError => ({
          kind: 'collectivite_not_found',
          collectiviteId,
        })
      )
      .with(
        'GET_COLLECTIVITE_IDENTITY_ERROR',
        (): CalculateCollectiviteMobilisationError => ({
          kind: 'collectivite_read_failed',
          collectiviteId,
        })
      )
      .exhaustive();
    return failure(mobilisationError, identityResult.cause);
  }
}
