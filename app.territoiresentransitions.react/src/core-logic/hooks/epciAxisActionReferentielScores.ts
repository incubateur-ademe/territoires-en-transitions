import {makeActionReferentielScoreStoreForReferentielForEpci} from 'core-logic/api/hybridStores';
import {useEffect, useState} from 'react';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {Referentiel} from 'types';

export const useEpciAxisActionReferentielScores = (props: {
  epciId: string;
  referentiel: Referentiel;
}): ActionReferentielScoreStorable[] => {
  const store = makeActionReferentielScoreStoreForReferentielForEpci(props);

  const [axisActionReferentielScores, setAxisActionReferentielScores] =
    useState<ActionReferentielScoreStorable[]>([]);

  useEffect(() => {
    const listener = async () => {
      const axisActionReferentielScores = await store.retrieveAll();
      setAxisActionReferentielScores(axisActionReferentielScores);
    };

    store.retrieveAll().then(storables => {
      if (axisActionReferentielScores !== storables)
        setAxisActionReferentielScores(storables);
    });
    store.addListener(listener);
    return () => {
      store.removeListener(listener);
    };
  });

  return axisActionReferentielScores;
};
