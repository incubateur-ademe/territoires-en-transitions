import { useSyncExternalStore } from 'react';
import {
  ActionDefinitionsCollection,
  createActionDefinitionsCollection,
} from './action-definitions.collection';
import { openActionDefinitionsPersistence } from './action-definitions-persistence';

let collection: ActionDefinitionsCollection | null = null;
let collectionPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!collectionPromise) {
    // la collection dépend de la persistance, ouverte de façon asynchrone ;
    // `subscribe` n'est jamais appelé côté serveur
    collectionPromise = openActionDefinitionsPersistence().then(
      (persistence) => {
        collection = createActionDefinitionsCollection(persistence);
        listeners.forEach((l) => l());
      }
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
export function useActionDefinitionsCollection(): ActionDefinitionsCollection | null {
  return useSyncExternalStore(
    subscribe,
    () => collection,
    () => null
  );
}
