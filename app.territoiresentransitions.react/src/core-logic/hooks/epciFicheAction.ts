import {makeFicheActionStoreForEpci} from 'core-logic/api/hybridStores';
import {useEffect, useState} from 'react';
import {FicheActionStorable} from 'storables/FicheActionStorable';

export const useEpciFicheAction = (props: {
  epciId: string;
}): FicheActionStorable[] => {
  const store = makeFicheActionStoreForEpci(props);

  const [ficheActions, setFicheActions] = useState<FicheActionStorable[]>([]);

  useEffect(() => {
    const listener = async () => {
      const axisActionReferentielScores = await store.retrieveAll();
      setFicheActions(axisActionReferentielScores);
    };

    store.retrieveAll().then(storables => {
      if (ficheActions !== storables) setFicheActions(storables);
    });
    store.addListener(listener);
    return () => {
      store.removeListener(listener);
    };
  });

  return ficheActions;
};
