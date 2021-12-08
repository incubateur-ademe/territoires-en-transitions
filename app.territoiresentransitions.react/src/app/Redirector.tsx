import {myCollectivitesPath, signInPath} from 'app/paths';
import {authBloc} from 'core-logic/observables/authBloc';
import {reaction} from 'mobx';
import {useHistory} from 'react-router-dom';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {useCollectiviteId} from 'core-logic/hooks';

export const CollectiviteRedirector = () => {
  const collectiviteId = useCollectiviteId();
  console.log(collectiviteId);
  currentCollectiviteBloc.update({id: collectiviteId});

  return null;
};

export const ConnectedRedirector = () => {
  const history = useHistory();

  reaction(
    () => authBloc.connected,
    connected => {
      console.log('authBloc connected changed', connected);
      if (connected) history.push(myCollectivitesPath);
      else history.push(signInPath);
    }
  );
  return null;
};
