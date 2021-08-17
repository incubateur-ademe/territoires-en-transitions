import {useActions, useAppState} from '.';
import {useEffect} from 'react';

export const useReferentielState = () => {
  const overmindActions = useActions();
  const overmindState = useAppState();
  useEffect(() => {
    console.log(
      'Fetching state related to Referentiel for epci with ID ',
      overmindState.currentEpciId
    );
    overmindActions.referentiels.fetchAllActionReferentielStatusAvancementsFromApi();
    overmindActions.referentiels.fetchAllActionReferentielScoresFromApi();
    overmindActions.referentiels.fetchAllActionReferentielCommentaireFromApi();
    // TODO return an action to do on unmount, to avoid memory leak.
    // See warnings `Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application`
  }, [overmindState.currentEpciId]);
};
