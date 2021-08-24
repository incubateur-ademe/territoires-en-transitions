import {HybridStore} from 'core-logic/api/hybridStore';
import {Storable} from 'core-logic/api/storable';
import {DependencyList, useEffect, useState} from 'react';

// Store hooks

/**
 * Use a single storable from a store.
 *
 * The function is O(n), should be ok for most of our use cases though.
 *
 *
 * @param storableId the id of the storable, best use the static buildId
 * methods to create an id from parameters rather than passing a string.
 *
 * @param store the store
 */
export function useStorable<T extends Storable>(
  storableId: string,
  store: HybridStore<T>,
  deps?: DependencyList
): T | null {
  const [storable, setStorable] = useState<T | null>(null);

  useEffect(() => {
    const listener = async () => {
      const storable = await store.retrieveById(storableId);
      setStorable(storable);
    };

    store.retrieveById(storableId).then(retrieved => {
      if (retrieved !== storable) setStorable(retrieved);
    });
    store.addListener(listener);
    return () => {
      store.removeListener(listener);
    };
  }, deps);

  return storable;
}

/**
 * Use all the storable from a store.
 *
 * The function is O(n), should be ok for most of our use cases though.
 *
 * @param store the store
 */
export function useAllStorables<T extends Storable>(
  store: HybridStore<T>
): T[] {
  const [storables, setStorables] = useState<T[]>([]);

  useEffect(() => {
    const listener = async () => {
      const storables = await store.retrieveAll();
      setStorables(storables);
    };
    store.retrieveAll().then(all => {
      if (!all.every(s => storables.includes(s))) setStorables(all);
    });
    store.addListener(listener);
    return () => {
      store.removeListener(listener);
    };
  });

  return storables;
}

/**
 * Use all the storable from a store.
 *
 * The function is O(n), should be ok for most of our use cases though.
 *
 * @param store the store
 */
export function useAllStorablesAsMap<T extends Storable>(
  store: HybridStore<T>
): Map<string, T> {
  const [storables, setStorables] = useState<Map<string, T>>(
    new Map<string, T>()
  );

  useEffect(() => {
    const listener = async () => {
      const storables = await store.retrieveAllAsMap();
      setStorables(storables);
    };
    store.retrieveAllAsMap().then(all => {
      for (const id of all.keys()) {
        if (storables.get(id) !== all.get(id)) {
          setStorables(all);
          break;
        }
      }
    });
    store.addListener(listener);
    return () => {
      store.removeListener(listener);
    };
  });

  return storables;
}
