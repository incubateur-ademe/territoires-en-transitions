import {myEpcisPath, signInPath} from 'app/paths';
import {authBloc} from 'core-logic/observables/authBloc';
import {reaction} from 'mobx';
import {useHistory, useParams} from 'react-router-dom';
import {currentEpciBloc} from 'core-logic/observables';
import {useEffect} from 'react';
import {findAllInRenderedTree} from 'react-dom/test-utils';
import {useEpciId} from 'core-logic/hooks';

export const Redirector = () => {
  const history = useHistory();
  const epciId = useEpciId();
  currentEpciBloc.update({siren: epciId || null});

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
