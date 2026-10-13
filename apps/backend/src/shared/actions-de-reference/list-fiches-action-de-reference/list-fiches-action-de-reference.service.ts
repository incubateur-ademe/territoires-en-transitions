import { Injectable } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { FicheWithRelations } from '@tet/domain/plans';
import { ListFichesActionDeReferenceInput } from '@tet/domain/shared';
import { uniq } from 'es-toolkit';
import { ActionDeReferenceFicheRepository } from '../action-de-reference-fiche.repository';
import { ListFichesActionDeReferenceError } from '../actions-de-reference.errors';
import { ActionsDeReferenceRepository } from '../actions-de-reference.repository';
import { maskFichesNotReadableBy } from './list-fiches-action-de-reference.rules';

type ListFichesActionDeReference = (
  input: ListFichesActionDeReferenceInput,
  secondArg: ServiceSecondArg
) => Promise<Result<FicheWithRelations[], ListFichesActionDeReferenceError>>;

@Injectable()
export class ListFichesActionDeReferenceService {
  constructor(
    private readonly actionsRepository: ActionsDeReferenceRepository,
    private readonly fichesRepository: ActionDeReferenceFicheRepository,
    private readonly listFichesService: ListFichesService,
    private readonly fichePermissions: FicheActionPermissionsService
  ) {}

  listFiches: ListFichesActionDeReference = async (
    { id, excludedCollectiviteId },
    { user, tx }
  ) => {
    const actionResult = await this.actionsRepository.get({ id });
    if (!actionResult.success) {
      return failure(actionResult.error);
    }

    const ficheIdsResult = await this.fichesRepository.listFicheIds({
      actionDeReferenceId: id,
      excludedCollectiviteId,
      tx,
    });
    if (!ficheIdsResult.success) {
      return failure(ficheIdsResult.error);
    }

    const ficheIds = ficheIdsResult.data;
    if (ficheIds.length === 0) {
      return success([]);
    }

    const { data: fiches } = await this.listFichesService.listFichesQuery(
      null,
      { ficheIds },
      undefined,
      tx
    );

    const collectiviteIdsWithRestreinteAccess =
      await this.listCollectiviteIdsWithRestreinteAccess({
        collectiviteIds: uniq(
          fiches.map(({ collectiviteId }) => collectiviteId)
        ),
        user,
        tx,
      });

    return success(
      maskFichesNotReadableBy({ fiches, collectiviteIdsWithRestreinteAccess })
    );
  };

  private async listCollectiviteIdsWithRestreinteAccess({
    collectiviteIds,
    user,
    tx,
  }: {
    collectiviteIds: readonly number[];
    user: ServiceSecondArg['user'];
    tx?: ServiceSecondArg['tx'];
  }): Promise<ReadonlySet<number>> {
    const accesses = await Promise.all(
      collectiviteIds.map(async (collectiviteId) => ({
        collectiviteId,
        canReadRestreinte: await this.fichePermissions.hasReadFichePermission(
          { collectiviteId, restreint: true },
          user,
          true,
          tx
        ),
      }))
    );
    return new Set(
      accesses
        .filter(({ canReadRestreinte }) => canReadRestreinte)
        .map(({ collectiviteId }) => collectiviteId)
    );
  }
}
