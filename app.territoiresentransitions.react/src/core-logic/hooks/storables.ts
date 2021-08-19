import {HybridStore} from 'core-logic/api/hybridStore';
import {Storable} from 'core-logic/api/storable';
import {useEffect, useState} from 'react';

export function useStorable<T extends Storable>(
  storableId: string,
  store: HybridStore<T>
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
  });

  return storable;
}

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
