import {
  QueryClient,
  QueryKey,
  QueryObserver,
  replaceEqualDeep,
} from '@tanstack/react-query';
import { createLiveQueryCollection } from '@tanstack/react-db';
import {
  ListActionsDynamicStateResult,
  ListActionsGroupedByIdResult,
  ReferentielId,
} from '@tet/domain/referentiels';
import type { ActionDefinitionsCollection } from './action-definitions.collection';
import {
  queryJoinedActions,
  queryStoredReferentielVersion,
} from './action.live-queries';
import type { ActionStatesCollection } from './action-states.collection';
import { assembleActionsGroupedById } from './assemble-actions-grouped-by-id';

/** Délai avant de libérer un store sans abonné (`gcTime` par défaut de TanStack) */
export const STORE_GC_TIME_MS = 5 * 60 * 1000;

export type ReferentielActionsSnapshot = {
  /** Actions assemblées, `undefined` tant que la jointure ou l'état manquent */
  data: ListActionsGroupedByIdResult | undefined;
  /** Version des définitions stockées localement, `undefined` si absentes */
  storedVersion: string | undefined;
  isStoredVersionReady: boolean;
  /** Version publiée, renvoyée avec l'état de la collectivité */
  publishedVersion: string | undefined;
  isError: boolean;
};

export const EMPTY_REFERENTIEL_ACTIONS_SNAPSHOT: ReferentielActionsSnapshot = {
  data: undefined,
  storedVersion: undefined,
  isStoredVersionReady: false,
  publishedVersion: undefined,
  isError: false,
};

/** Store externe, à lire avec `useSyncExternalStore` */
export type ReferentielActionsStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ReferentielActionsSnapshot;
};

type ReferentielActionsScope = {
  definitions: ActionDefinitionsCollection;
  /** change quand la collection des définitions est remplacée */
  definitionsGeneration: number;
  states: ActionStatesCollection;
  /** clé de la query tRPC `listActionsGroupedById` (réponse brute) */
  stateQueryKey: QueryKey;
  collectiviteId: number;
  referentielId: ReferentielId;
};

/**
 * Forme commune des live queries observées par le store : l'union de leurs
 * types n'est pas appelable (types de lignes différents)
 */
type WatchedCollection = {
  subscribeChanges: (callback: () => void) => { unsubscribe: () => void };
  on: (event: 'status:change', callback: () => void) => () => void;
};

/** Même contenu : on garde l'objet précédent (identité stable pour React) */
export function isSameSnapshot(
  a: ReferentielActionsSnapshot,
  b: ReferentielActionsSnapshot
): boolean {
  return (
    a.data === b.data &&
    a.storedVersion === b.storedVersion &&
    a.isStoredVersionReady === b.isStoredVersionReady &&
    a.publishedVersion === b.publishedVersion &&
    a.isError === b.isError
  );
}

const storesByQueryClient = new WeakMap<
  QueryClient,
  Map<string, ReferentielActionsStore>
>();

/**
 * Actions d'un référentiel pour une collectivité, partagées entre toutes les
 * instances de `useListActionsGroupedById` : une seule jointure (live query)
 * et un seul assemblage par couple collectivité/référentiel.
 *
 * Le store est libéré `STORE_GC_TIME_MS` après le départ de son dernier
 * abonné.
 */
export function getReferentielActionsStore(
  queryClient: QueryClient,
  scope: ReferentielActionsScope
): ReferentielActionsStore {
  const stores =
    storesByQueryClient.get(queryClient) ??
    new Map<string, ReferentielActionsStore>();
  storesByQueryClient.set(queryClient, stores);

  const storeKey = `${scope.definitionsGeneration}:${scope.collectiviteId}:${scope.referentielId}`;
  let store = stores.get(storeKey);
  if (!store) {
    store = createReferentielActionsStore(queryClient, scope, () =>
      stores.delete(storeKey)
    );
    stores.set(storeKey, store);
  }
  return store;
}

function createReferentielActionsStore(
  queryClient: QueryClient,
  {
    definitions,
    states,
    stateQueryKey,
    referentielId,
  }: ReferentielActionsScope,
  onDispose: () => void
): ReferentielActionsStore {
  const joined = createLiveQueryCollection((q) =>
    queryJoinedActions(q, definitions, states)
  );
  const storedVersion = createLiveQueryCollection((q) =>
    queryStoredReferentielVersion(q, definitions, referentielId)
  );
  // réponse brute de l'état, chargée par la collection : on n'y lit que les
  // champs qui ne sont pas des lignes (version publiée, actions masquées)
  const stateObserver = new QueryObserver<ListActionsDynamicStateResult>(
    queryClient,
    { queryKey: stateQueryKey, enabled: false }
  );

  const listeners = new Set<() => void>();
  const stopFns: Array<() => void> = [];
  let snapshot = EMPTY_REFERENTIEL_ACTIONS_SNAPSHOT;
  // l'assemblage n'est refait que si les lignes ou la réponse ont changé
  let rowsRevision = 0;
  let assembled:
    | {
        rowsRevision: number;
        stateResponse: ListActionsDynamicStateResult;
        data: ListActionsGroupedByIdResult;
      }
    | undefined;
  let isStarted = false;
  let isDisposed = false;
  let isRefreshScheduled = false;
  let disposeTimer: ReturnType<typeof setTimeout> | undefined;

  const computeSnapshot = (): ReferentielActionsSnapshot => {
    const stateResponse = stateObserver.getCurrentResult().data;
    let data: ListActionsGroupedByIdResult | undefined;
    if (joined.status === 'ready' && stateResponse) {
      if (
        assembled?.rowsRevision !== rowsRevision ||
        assembled.stateResponse !== stateResponse
      ) {
        assembled = {
          rowsRevision,
          stateResponse,
          // les lignes sont souvent réémises à l'identique (chargement,
          // persistance) : on garde les objets inchangés pour ne pas faire
          // recalculer (et remonter) les colonnes de la table
          data: replaceEqualDeep(
            assembled?.data,
            assembleActionsGroupedById(
              joined.toArray,
              stateResponse.hiddenActionIds,
              (actionId) => definitions.get(actionId)
            )
          ),
        };
      }
      data = assembled.data;
    }

    return {
      data,
      storedVersion: storedVersion.toArray[0]?.referentielVersion,
      isStoredVersionReady: storedVersion.status === 'ready',
      publishedVersion: stateResponse?.referentielVersion,
      isError: joined.status === 'error',
    };
  };

  // plusieurs sources changent souvent ensemble (rechargement de l'état) :
  // un seul recalcul et une seule notification
  const scheduleRefresh = () => {
    if (isRefreshScheduled) return;
    isRefreshScheduled = true;
    queueMicrotask(() => {
      isRefreshScheduled = false;
      if (isDisposed) return;
      const next = computeSnapshot();
      if (!isSameSnapshot(next, snapshot)) {
        snapshot = next;
        listeners.forEach((l) => l());
      }
    });
  };
  const onRowsChange = () => {
    rowsRevision++;
    scheduleRefresh();
  };

  const start = () => {
    if (isStarted) return;
    isStarted = true;
    // abonnements gardés jusqu'à la libération : le résultat reste à jour
    // pour les instances suivantes
    const watchedCollections: WatchedCollection[] = [joined, storedVersion];
    for (const collection of watchedCollections) {
      const subscription = collection.subscribeChanges(onRowsChange);
      stopFns.push(
        () => subscription.unsubscribe(),
        collection.on('status:change', scheduleRefresh)
      );
    }
    stopFns.push(stateObserver.subscribe(scheduleRefresh));
    scheduleRefresh();
  };

  const dispose = () => {
    isDisposed = true;
    stopFns.forEach((stop) => stop());
    stateObserver.destroy();
    void joined.cleanup().catch(() => undefined);
    void storedVersion.cleanup().catch(() => undefined);
    onDispose();
  };

  // libéré aussi s'il n'est jamais lu (rendu React abandonné)
  disposeTimer = setTimeout(dispose, STORE_GC_TIME_MS);

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      clearTimeout(disposeTimer);
      start();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          disposeTimer = setTimeout(dispose, STORE_GC_TIME_MS);
        }
      };
    },
    getSnapshot: () => snapshot,
  };
}
