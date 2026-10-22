import type { QueryClient } from '@tanstack/react-query';
import { BasicIndex, Collection, createCollection } from '@tanstack/react-db';
import {
  queryCollectionOptions,
  QueryCollectionUtils,
} from '@tanstack/query-db-collection';
import type { AppRouter } from '@tet/api';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';
import {
  ActionDynamicState,
  ActionId,
  ReferentielId,
} from '@tet/domain/referentiels';
import type { TRPCClient } from '@trpc/client';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';

/**
 * Ligne de la collection : état d'une action pour la collectivité, avec sa
 * position dans la réponse du backend (ordre de parcours de l'arbre), que les
 * consommateurs retrouvent dans `Object.values(actionsById)`.
 */
export type ActionStateRow = ActionDynamicState & { position: number };

export type ActionStatesCollection = Collection<
  ActionStateRow,
  ActionId,
  QueryCollectionUtils<ActionStateRow, ActionId>
>;

type ActionStatesScope = {
  collectiviteId: number;
  referentielId: ReferentielId;
};

const collectionsByQueryClient = new WeakMap<
  QueryClient,
  Map<string, ActionStatesCollection>
>();

/**
 * État des actions d'un référentiel pour une collectivité (scores, pilotes,
 * services, généalogie), une collection par couple collectivité/référentiel.
 *
 * La collection est adossée à la query tRPC `listActionsGroupedById`, avec la
 * même clé de cache : les invalidations existantes (après recalcul des
 * scores, entre onglets…) la rafraîchissent sans changement.
 */
export function getActionStatesCollection(
  {
    queryClient,
    trpc,
    trpcClient,
  }: {
    queryClient: QueryClient;
    trpc: TRPCOptionsProxy<AppRouter>;
    trpcClient: TRPCClient<AppRouter>;
  },
  { collectiviteId, referentielId }: ActionStatesScope
): ActionStatesCollection {
  let collections = collectionsByQueryClient.get(queryClient);
  if (!collections) {
    collections = new Map();
    collectionsByQueryClient.set(queryClient, collections);
  }

  const scopeKey = `${collectiviteId}:${referentielId}`;
  let collection = collections.get(scopeKey);
  if (!collection) {
    const input = { collectiviteId, referentielId };
    collection = createCollection(
      queryCollectionOptions({
        id: `action-states:${scopeKey}`,
        queryClient,
        queryKey:
          trpc.referentiels.actions.listActionsGroupedById.queryKey(input),
        queryFn: ({ signal }) =>
          trpcClient.referentiels.actions.listActionsGroupedById.query(input, {
            signal,
          }),
        select: (response) =>
          Object.values(response.actionsById).map(
            (state, position): ActionStateRow => ({ ...state, position })
          ),
        getKey: (row: ActionStateRow) => row.actionId,
        // index créés à la demande pour la jointure avec les définitions
        autoIndex: 'eager',
        defaultIndexType: BasicIndex,
        ...DISABLE_AUTO_REFETCH,
      })
    ) as unknown as ActionStatesCollection;
    collections.set(scopeKey, collection);
  }
  return collection;
}
