import {myEpcisPath, signInPath} from 'app/paths';
import {authBloc} from 'core-logic/observables/authBloc';
import {reaction} from 'mobx';
import {useHistory} from 'react-router-dom';
import {currentEpciBloc} from 'core-logic/observables';
import {useEpciId} from 'core-logic/hooks';

export const EpciRedirector = () => {
  const epciId = useEpciId();
  console.log(epciId);
  currentEpciBloc.update({siren: epciId || null});

  return null;
};

export const ConnectedRedirector = () => {
  const history = useHistory();

  reaction(
    () => authBloc.connected,
    connected => {
      console.log('authBloc connected changed', connected);
      if (connected) history.push(myEpcisPath);
      else history.push(signInPath);
    }
  );
  return null;
};
