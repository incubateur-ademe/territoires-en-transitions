import { Injectable } from '@nestjs/common';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  CommonErrorEnum,
  type CommonError,
} from '@tet/backend/utils/trpc/common-errors';
import {
  buildSousIndicateurSeries,
  calculateIndicateurTotalsByDate,
  COLLECTIVITE_SOURCE_ID,
  type IndicateurTotalAtDate,
  type SousIndicateurRattache,
  type SousIndicateurSerie,
} from '@tet/domain/indicateurs';
import { groupBy, mapValues } from 'es-toolkit';
import { IndicateurValeursReadAccessService } from '../indicateur-valeurs-read-access.service';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import { GetIndicateurTotalsInput } from './get-indicateur-totals.input';
import { GetIndicateurTotalsRepository } from './get-indicateur-totals.repository';

export type GetIndicateurTotalsError = Extract<
  CommonError,
  'UNAUTHORIZED' | 'NOT_FOUND' | 'DATABASE_ERROR'
>;

@Injectable()
export class GetIndicateurTotalsService {
  constructor(
    private readonly repository: GetIndicateurTotalsRepository,
    private readonly valeursRepository: IndicateurValeursRepository,
    private readonly readAccessService: IndicateurValeursReadAccessService
  ) {}

  async getIndicateurTotals(
    { collectiviteId, indicateurId }: GetIndicateurTotalsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<readonly IndicateurTotalAtDate[], GetIndicateurTotalsError>
  > {
    const readerResult = await this.readAccessService.resolveReader({
      collectiviteId,
      user,
      tx,
    });
    if (!readerResult.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const parent = await this.repository.getParentForTotals(
      { parentId: indicateurId, collectiviteId },
      tx
    );
    if (parent === null) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const rattaches = await this.repository.listSousIndicateursRattaches(
      { parentId: indicateurId, collectiviteId },
      tx
    );
    if (rattaches.length === 0) {
      return success([]);
    }

    const seriesResult = await this.listSeries({
      collectiviteId,
      indicateurId,
      rattaches,
      tx,
    });
    if (!seriesResult.success) {
      return seriesResult;
    }

    return success(
      calculateIndicateurTotalsByDate({
        reader: readerResult.data,
        precision: parent.precision,
        parentConfidentiel: parent.confidentiel,
        sousIndicateurs: seriesResult.data,
      })
    );
  }

  private async listSeries({
    collectiviteId,
    indicateurId,
    rattaches,
    tx,
  }: {
    collectiviteId: number;
    indicateurId: number;
    rattaches: readonly SousIndicateurRattache[];
    tx?: Transaction;
  }): Promise<Result<readonly SousIndicateurSerie[], 'DATABASE_ERROR'>> {
    const valeursResult = await this.valeursRepository.listIndicateurValeurs(
      {
        collectiviteId,
        indicateurIds: rattaches.map(({ id }) => id),
        sources: [COLLECTIVITE_SOURCE_ID],
      },
      tx
    );
    if (!valeursResult.success) {
      return valeursResult;
    }

    const valeursByIndicateurId = mapValues(
      groupBy(
        valeursResult.data,
        ({ indicateurValeur }) => indicateurValeur.indicateurId
      ),
      (valeursOfIndicateur) =>
        valeursOfIndicateur.map(({ indicateurValeur }) => ({
          dateValeur: indicateurValeur.dateValeur,
          resultat: indicateurValeur.resultat,
          objectif: indicateurValeur.objectif,
        }))
    );

    return success(
      buildSousIndicateurSeries({
        indicateurId,
        rattaches,
        valeursByIndicateurId,
      })
    );
  }
}
