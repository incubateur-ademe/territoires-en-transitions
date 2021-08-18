import {useEffect, useState} from 'react';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {ficheActionStore} from 'core-logic/api/hybridStores';

export const useFiche = (ficheId: string) => {
  const [fiche, setFiche] = useState<FicheActionStorable | null>(null);

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

export const useAllFiches = () => {
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
