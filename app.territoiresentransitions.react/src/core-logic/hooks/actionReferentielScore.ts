import {useEffect, useState} from 'react';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {getActionReferentielScoreStoreFromId} from 'core-logic/api/hybridStores';

export const useActionReferentielScore = (
  actionReferentielScoreStorableId: string
) => {
  const [actionReferentielScore, setActionReferentielScore] =
    useState<ActionReferentielScoreStorable | null>(null);

  const actionReferentielScoreStore = getActionReferentielScoreStoreFromId(
    actionReferentielScoreStorableId
  );
  useEffect(() => {
    const listener = async () => {
      const actionReferentielScore =
        await actionReferentielScoreStore.retrieveById(
          actionReferentielScoreStorableId
        );
      setActionReferentielScore(actionReferentielScore);
    };

    actionReferentielScoreStore
      .retrieveById(actionReferentielScoreStorableId)
      .then(storable => {
        if (
          !actionReferentielScore ||
          !actionReferentielScore.equals(storable)
        ) {
          setActionReferentielScore(storable);
        }
      });
    actionReferentielScoreStore.addListener(listener);
    return () => {
      actionReferentielScoreStore.removeListener(listener);
    };
  }, [actionReferentielScore]);

  return actionReferentielScore;
};
