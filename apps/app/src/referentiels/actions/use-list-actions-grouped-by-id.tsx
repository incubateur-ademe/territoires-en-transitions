import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ListActionsGroupedByIdResult,
  ReferentielId,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { getActionStatesCollection } from './db/action-states.collection';
import {
  EMPTY_REFERENTIEL_ACTIONS_SNAPSHOT,
  getReferentielActionsStore,
} from './db/referentiel-actions.store';
import {
  getDefinitionsSyncKey,
  syncReferentielDefinitions,
} from './db/sync-referentiel-definitions';
import {
  ActionDefinitionsHandle,
  fallBackToInMemoryDefinitions,
  useActionDefinitionsCollection,
} from './db/use-action-definitions-collection';

export type ActionsGroupedByIdData = ListActionsGroupedByIdResult;

type ReferentielActionsResult = {
  data: ListActionsGroupedByIdResult | undefined;
  isPending: boolean;
  isError: boolean;
};

/**
 * Liste les actions des référentiels demandés. Pour chacun, jointure (live
 * query TanStack DB, partagée entre les instances du hook) entre :
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

const subscribeNothing = () => () => undefined;
const getEmptySnapshot = () => EMPTY_REFERENTIEL_ACTIONS_SNAPSHOT;

function useReferentielActions(
  referentielId: ReferentielId,
  isRequested: boolean,
  {
    definitions,
    collectiviteId,
  }: {
    definitions: ActionDefinitionsHandle | null;
    collectiviteId: number | undefined;
  }
): ReferentielActionsResult {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const isActive = isRequested && collectiviteId !== undefined;
  const states = isActive
    ? getActionStatesCollection(
        { queryClient, trpc, trpcClient },
        { collectiviteId, referentielId }
      )
    : undefined;

  // l'état est chargé sans attendre l'ouverture de la persistance locale
  // des définitions (worker SQLite)
  useEffect(() => {
    states?.preload().catch(() => undefined);
  }, [states]);

  // jointure et assemblage partagés entre les instances du hook
  const store =
    isActive && states && definitions
      ? getReferentielActionsStore(queryClient, {
          definitions: definitions.collection,
          definitionsGeneration: definitions.generation,
          states,
          stateQueryKey:
            trpc.referentiels.actions.listActionsGroupedById.queryKey({
              collectiviteId,
              referentielId,
            }),
          collectiviteId,
          referentielId,
        })
      : undefined;
  const snapshot = useSyncExternalStore(
    store?.subscribe ?? subscribeNothing,
    store?.getSnapshot ?? getEmptySnapshot,
    getEmptySnapshot
  );

  // Chargement des définitions si absentes, ou si la version publiée a changé.
  // Une query par clé de synchro : dédupliquée entre les instances du hook,
  // lancée une seule fois (pas de boucle), relancée après une erreur. La
  // génération distingue la collection de repli en mémoire, vide.
  const { storedVersion, publishedVersion } = snapshot;
  const syncKey =
    store && snapshot.isStoredVersionReady
      ? getDefinitionsSyncKey({
          referentielId,
          storedVersion,
          publishedVersion,
        })
      : null;
  const syncQuery = useQuery({
    queryKey: ['action-definitions-sync', definitions?.generation, syncKey],
    queryFn:
      syncKey && definitions
        ? () =>
            syncReferentielDefinitions({
              referentielId,
              publishedVersion,
              collection: definitions.collection,
              queryClient,
              trpc,
              onWriteError: (error) =>
                fallBackToInMemoryDefinitions(definitions.collection, error),
            })
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // un référentiel sans aucune définition ne laisse pas de version stockée
  const hasDefinitions = storedVersion !== undefined || syncQuery.isSuccess;
  const data = hasDefinitions ? snapshot.data : undefined;
  const isError = syncQuery.isError || snapshot.isError;

  return useMemo(
    () => ({
      data,
      // en erreur, on ne reste pas en chargement : l'erreur doit s'afficher
      isPending: isRequested && !data && !isError,
      isError,
    }),
    [data, isRequested, isError]
  );
}
