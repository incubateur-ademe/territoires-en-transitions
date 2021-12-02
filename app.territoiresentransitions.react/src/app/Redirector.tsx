import {myEpcisPath} from 'app/paths';
import {authBloc} from 'core-logic/observables/authBloc';
import {reaction} from 'mobx';
import {useHistory} from 'react-router-dom';

export const Redirector = () => {
  const history = useHistory();
  reaction(
    () => authBloc.connected,
    connected => {
      console.log('authBloc connected changed', connected);
      if (connected) history.push(myEpcisPath);
      else;
    }
  );

  return null;
};
