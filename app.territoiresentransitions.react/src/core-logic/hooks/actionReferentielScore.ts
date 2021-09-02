import {useEffect, useState} from 'react';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {actionReferentielScoreStore} from 'core-logic/api/hybridStores';

export const useActionReferentielScore = (
  actionReferentielScoreStorableId: string
) => {
  const [actionReferentielScore, setActionReferentielScore] =
    useState<ActionReferentielScoreStorable | null>(null);

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
        if (actionReferentielScore !== storable)
          setActionReferentielScore(storable);
      });
    actionReferentielScoreStore.addListener(listener);
    return () => {
      actionReferentielScoreStore.removeListener(listener);
    };
  });

  return actionReferentielScore;
};
