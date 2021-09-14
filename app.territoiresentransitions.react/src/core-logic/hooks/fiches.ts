import {getFicheActionStoreForEpci} from 'core-logic/api/hybridStores';
import {useEffect, useState} from 'react';
import {FicheActionStorable} from 'storables/FicheActionStorable';

export const useFiche = (ficheId: string, epciId: string) => {
  const [fiche, setFiche] = useState<FicheActionStorable | null>(null);
  const ficheActionStore = getFicheActionStoreForEpci(epciId);

  useEffect(() => {
    const listener = async () => {
      const fiche = await ficheActionStore.retrieveById(ficheId);
      setFiche(fiche);
    };

    ficheActionStore.retrieveById(ficheId).then(storable => {
      if (fiche !== storable) setFiche(storable);
    });
    ficheActionStore.addListener(listener);
    return () => {
      ficheActionStore.removeListener(listener);
    };
  });

  return fiche;
};

export const useAllFiches = (epciId: string) => {
  const ficheActionStore = getFicheActionStoreForEpci(epciId);
  const [fiches, setFiches] = useState<FicheActionStorable[]>([]);

  useEffect(() => {
    const listener = async () => {
      const fiches = await ficheActionStore.retrieveAll();
      setFiches(fiches);
    };
    ficheActionStore.retrieveAll().then(all => {
      if (!all.every(s => fiches.includes(s))) setFiches(all);
    });
    ficheActionStore.addListener(listener);
    return () => {
      ficheActionStore.removeListener(listener);
    };
  });

  return fiches;
};
