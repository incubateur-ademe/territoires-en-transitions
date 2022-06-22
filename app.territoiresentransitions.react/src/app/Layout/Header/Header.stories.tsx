import {authBloc, currentCollectiviteBloc} from 'core-logic/observables';
import Header from './Header';
import {HeaderObserver} from './Header';

export default {
  component: Header,
};

const fakeCollectivite: CurrentCollectiviteObserved | null = {
  nom: 'Test collectivite',
  collectivite_id: 1,
  role_name: null,
};

export const NotConnected = () => (
  <HeaderObserver
    authBloc={authBloc}
    currentCollectiviteBloc={currentCollectiviteBloc}
    isConnected={false}
    collectivite={null}
  />
);
export const Connected = () => (
  <HeaderObserver
    authBloc={authBloc}
    currentCollectiviteBloc={currentCollectiviteBloc}
    isConnected
    collectivite={null}
  />
);
export const WithCollectivite = () => (
  <HeaderObserver
    authBloc={authBloc}
    currentCollectiviteBloc={currentCollectiviteBloc}
    isConnected
    collectivite={fakeCollectivite}
  />
);
