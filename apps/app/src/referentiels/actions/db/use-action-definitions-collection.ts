import { useSyncExternalStore } from 'react';
import {
  ActionDefinitionsCollection,
  createActionDefinitionsCollection,
} from './action-definitions.collection';
import { openActionDefinitionsPersistence } from './action-definitions-persistence';

/**
 * Collection des définitions, avec un numéro qui change quand elle est
 * remplacée (repli en mémoire) : les clés qui en dépendent changent aussi.
 */
export type ActionDefinitionsHandle = {
  collection: ActionDefinitionsCollection;
  generation: number;
};

let handle: ActionDefinitionsHandle | null = null;
// collection persistée en service, `null` en mémoire ou après le repli
let persistedCollection: ActionDefinitionsCollection | null = null;
let collectionPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setCollection(collection: ActionDefinitionsCollection) {
  handle = { collection, generation: (handle?.generation ?? 0) + 1 };
  listeners.forEach((l) => l());
}

/**
 * Remplace la collection persistée par une collection en mémoire, vide :
 * les définitions sont rechargées. Une seule fois, et seulement si la
 * collection en échec est celle en service.
 */
export function fallBackToInMemoryDefinitions(
  failed: ActionDefinitionsCollection,
  error: unknown
) {
  if (failed !== persistedCollection || handle?.collection !== failed) {
    return;
  }
  persistedCollection = null;
  console.warn(
    'Persistance locale des référentiels en échec, repli en mémoire',
    error
  );
  setCollection(createActionDefinitionsCollection(null));
}

function createDefinitionsCollection(
  persistence: Awaited<ReturnType<typeof openActionDefinitionsPersistence>>
): ActionDefinitionsCollection {
  if (!persistence) {
    return createActionDefinitionsCollection(null);
  }
  try {
    const collection = createActionDefinitionsCollection(persistence);
    persistedCollection = collection;
    // erreur après l'ouverture (quota, base corrompue, worker arrêté…)
    collection.on('status:error', (event) =>
      fallBackToInMemoryDefinitions(collection, event)
    );
    return collection;
  } catch (error) {
    console.warn(
      'Collection persistée des définitions indisponible, repli en mémoire',
      error
    );
    return createActionDefinitionsCollection(null);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!collectionPromise) {
    // la collection dépend de la persistance, ouverte de façon asynchrone ;
    // `subscribe` n'est jamais appelé côté serveur
    collectionPromise = openActionDefinitionsPersistence().then((persistence) =>
      setCollection(createDefinitionsCollection(persistence))
    );
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Collection (unique pour l'application) des définitions des actions, ou
 * `null` tant que la persistance locale n'est pas ouverte, et toujours côté
 * serveur (TanStack DB est client uniquement).
 */
export function useActionDefinitionsCollection(): ActionDefinitionsHandle | null {
  return useSyncExternalStore(
    subscribe,
    () => handle,
    () => null
  );
}
