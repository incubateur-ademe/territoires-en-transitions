import {myCollectivitesPath, signInPath} from 'app/paths';
import {authBloc} from 'core-logic/observables/authBloc';
import {reaction} from 'mobx';
import {useHistory} from 'react-router-dom';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {useCollectiviteId} from 'core-logic/hooks/params';

export const CollectiviteRedirector = () => {
  const collectiviteId = useCollectiviteId();
  console.log(collectiviteId);
  currentCollectiviteBloc.update({collectiviteId});

  return null;
};

export const ConnectedRedirector = () => {
  const history = useHistory();

  reaction(
    () => authBloc.connected,
    connected => {
      console.log('authBloc connected changed', connected);
      if (
        connected &&
        authBloc.invitationState !== 'waitingForLogin' &&
        authBloc.invitationState !== 'waitingForAcceptation'
      ) {
        history.push(myCollectivitesPath);
      } else history.push(signInPath);
    }
  );

  reaction(
    () => authBloc.invitationState,
    state => {
      console.log('authBloc invitation state changed', state);
      if (state === 'accepted') history.push(myCollectivitesPath);
      if (state === 'waitingForLogin') history.push(signInPath);
    }
  );

  return null;
};
