import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { useTRPC, useTRPCClient } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ListActionsGroupedByIdResult,
  ReferentielId,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { useMemo } from 'react';
import { ActionDefinitionsCollection } from './db/action-definitions.collection';
import { getActionStatesCollection } from './db/action-states.collection';
import {
  queryJoinedActions,
  queryStoredReferentielVersion,
} from './db/action-live-queries';
import { assembleActionsGroupedById } from './db/assemble-actions-grouped-by-id';
import {
  getDefinitionsSyncKey,
  syncReferentielDefinitions,
} from './db/sync-referentiel-definitions';
import { useActionDefinitionsCollection } from './db/use-action-definitions-collection';

export type ActionsGroupedByIdData = ListActionsGroupedByIdResult;

type ReferentielActionsResult = {
  data: ListActionsGroupedByIdResult | undefined;
  isPending: boolean;
  isError: boolean;
};

/**
 * Liste les actions des référentiels demandés. Pour chacun, jointure (live
 * query TanStack DB) entre :
 * - les définitions (partie statique, partagée entre collectivités), stockées
 *   localement entre les sessions et rechargées seulement quand la version
 *   publiée du référentiel change ;
 * - l'état de la collectivité (scores, pilotes, services, généalogie),
 *   rechargé après chaque écriture.
 */
export function useListActionsGroupedById(
  {
    referentielIds,
    collectiviteId,
  }: {
    referentielIds: ReferentielId[];
    collectiviteId?: number;
  },
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) {
  const collectiviteIdFromContext = useCollectiviteId();
  const resolvedCollectiviteId = collectiviteId ?? collectiviteIdFromContext;
  const definitions = useActionDefinitionsCollection();

  const scope = { definitions, collectiviteId: resolvedCollectiviteId };
  const isRequested = (referentielId: ReferentielId) =>
    enabled && referentielIds.includes(referentielId);

  // Un appel par référentiel connu (liste fixe) : les hooks ne peuvent pas
  // être appelés dans une boucle sur `referentielIds`.
  const cae = useReferentielActions(
    ReferentielIdEnum.CAE,
    isRequested(ReferentielIdEnum.CAE),
    scope
  );
  const eci = useReferentielActions(
    ReferentielIdEnum.ECI,
    isRequested(ReferentielIdEnum.ECI),
    scope
  );
  const te = useReferentielActions(
    ReferentielIdEnum.TE,
    isRequested(ReferentielIdEnum.TE),
    scope
  );
  const teTest = useReferentielActions(
    ReferentielIdEnum['TE-TEST'],
    isRequested(ReferentielIdEnum['TE-TEST']),
    scope
  );

  const referentielIdsKey = referentielIds.join(',');
  return useMemo(() => {
    const resultsById: Record<ReferentielId, ReferentielActionsResult> = {
      cae,
      eci,
      te,
      'te-test': teTest,
    };
    const ids = (
      referentielIdsKey ? referentielIdsKey.split(',') : []
    ) as ReferentielId[];

    const data = new Map<ReferentielId, ListActionsGroupedByIdResult>();
    for (const referentielId of ids) {
      const result = resultsById[referentielId].data;
      if (result) {
        data.set(referentielId, result);
      }
    }

    return {
      data,
      isPending: ids.some((id) => resultsById[id].isPending),
      isError: ids.some((id) => resultsById[id].isError),
    };
  }, [referentielIdsKey, cae, eci, te, teTest]);
}

function useReferentielActions(
  referentielId: ReferentielId,
  isRequested: boolean,
  {
    definitions,
    collectiviteId,
  }: {
    definitions: ActionDefinitionsCollection | null;
    collectiviteId: number | undefined;
  }
): ReferentielActionsResult {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const isActive =
    isRequested && definitions !== null && collectiviteId !== undefined;
  const states = isActive
    ? getActionStatesCollection(
        { queryClient, trpc, trpcClient },
        { collectiviteId, referentielId }
      )
    : undefined;

  // Réponse brute de l'état, chargée par la collection : on lit seulement les
  // champs qui ne sont pas des lignes (version publiée, actions masquées)
  const { data: stateResponse } = useQuery({
    ...trpc.referentiels.actions.listActionsGroupedById.queryOptions(
      isActive ? { referentielId, collectiviteId } : skipToken
    ),
    enabled: false,
  });

  const storedVersionQuery = useLiveQuery({
    query: (q) =>
      isActive
        ? queryStoredReferentielVersion(q, definitions, referentielId)
        : undefined,
  });

  const joinedQuery = useLiveQuery({
    query: (q) =>
      isActive && states
        ? queryJoinedActions(q, definitions, states)
        : undefined,
  });

  // Chargement des définitions si absentes, ou si la version publiée a changé.
  // Une query par clé de synchro : dédupliquée entre les instances du hook,
  // lancée une seule fois (pas de boucle), relancée après une erreur.
  const storedVersion = storedVersionQuery.data?.referentielVersion;
  const publishedVersion = stateResponse?.referentielVersion;
  const syncKey =
    isActive && storedVersionQuery.isReady
      ? getDefinitionsSyncKey({
          referentielId,
          storedVersion,
          publishedVersion,
        })
      : null;
  const syncQuery = useQuery({
    queryKey: ['action-definitions-sync', syncKey],
    queryFn:
      syncKey && definitions
        ? () =>
            syncReferentielDefinitions({
              referentielId,
              publishedVersion,
              collection: definitions,
              queryClient,
              trpc,
            })
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const joinedRows = joinedQuery.data;
  const hasDefinitions = storedVersion !== undefined;
  const data = useMemo(
    () =>
      definitions && hasDefinitions && joinedRows && stateResponse
        ? assembleActionsGroupedById(
            joinedRows,
            stateResponse.hiddenActionIds,
            // `joinedRows` change aussi quand les définitions sont rechargées
            (actionId) => definitions.get(actionId)
          )
        : undefined,
    [definitions, hasDefinitions, joinedRows, stateResponse]
  );

  return useMemo(
    () => ({
      data,
      isPending: isRequested && !data,
      isError: syncQuery.isError || joinedQuery.isError,
    }),
    [data, isRequested, syncQuery.isError, joinedQuery.isError]
  );
}
