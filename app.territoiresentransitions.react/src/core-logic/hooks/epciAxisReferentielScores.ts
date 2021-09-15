import {getActionReferentielScoreStoreForReferentielForEpci} from 'core-logic/api/hybridStores';
import {useEffect, useState} from 'react';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {Referentiel} from 'types';
import {actionIdDepth} from 'utils/actions';

const storablesToState = (storables: ActionReferentielScoreStorable[]) =>
  storables.filter(score => actionIdDepth(score.action_id) <= 1);

export const useEpciAxisReferentielScores = (props: {
  epciId: string;
  referentiel: Referentiel;
}): ActionReferentielScoreStorable[] => {
  const [axisActionReferentielScores, setAxisActionReferentielScores] =
    useState<ActionReferentielScoreStorable[]>([]);

  const store = getActionReferentielScoreStoreForReferentielForEpci(props);

  useEffect(() => {
    const listener = async () => {
      const axisActionReferentielScores = await store.retrieveAll();
      setAxisActionReferentielScores(
        storablesToState(axisActionReferentielScores)
      );
    };

    store.retrieveAll().then(storables => {
      const state = storablesToState(storables);
      if (
        axisActionReferentielScores.length !== state.length ||
        !axisActionReferentielScores.every((element, index) =>
          element.equals(state[index])
        )
      ) {
        setAxisActionReferentielScores(state);
      }
    });
    store.addListener(listener);
    return () => {
      store.removeListener(listener);
    };
  }, [axisActionReferentielScores]);

  return axisActionReferentielScores;
};
