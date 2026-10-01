import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ListActionsDynamicStateResult } from '@tet/domain/referentiels';
import { listActionsGroupedByIdInputSchema } from './list-actions-grouped-by-id.input';
import { listActionsErrorConfig } from './list-actions.errors';
import { ListActionsService } from './list-actions.service';

@Injectable()
export class ListActionsRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listActionsErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly permissions: PermissionService,
    private readonly collectivite: CollectivitesService,
    private readonly listActionsService: ListActionsService
  ) {}

  router = this.trpc.router({
    listActionsGroupedById: this.trpc.authedProcedure
      .input(listActionsGroupedByIdInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        return withLegacyCompatFields(
          this.getResultDataOrThrowError(
            await this.listActionsService.listActionsGroupedById(input, {
              user,
            })
          )
        );
      }),
  });
}

/**
 * TODO: compatibilité temporaire avec les onglets encore ouverts sur l'ancien
 * bundle front, qui lisent `hiddenActions` et `childrenIdsWithExprScore` sur
 * cette réponse (et plantent s'ils sont absents). À supprimer dans la release
 * suivant celle-ci, une fois les anciens onglets rechargés.
 *
 * Les champs ne sont pas déclarés dans le type de retour : le front actuel ne
 * doit pas les lire (`mergeActionDefinitionsAndState` les recalcule).
 */
function withLegacyCompatFields(
  result: ListActionsDynamicStateResult
): ListActionsDynamicStateResult {
  const actionsById: ListActionsDynamicStateResult['actionsById'] = {};
  for (const actionId in result.actionsById) {
    const actionWithCompatFields = {
      ...result.actionsById[actionId],
      childrenIdsWithExprScore: [],
    };
    actionsById[actionId] = actionWithCompatFields;
  }

  const resultWithCompatFields = {
    ...result,
    actionsById,
    hiddenActions: [],
  };
  return resultWithCompatFields;
}
