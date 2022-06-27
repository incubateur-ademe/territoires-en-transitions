import {
  authBloc,
  currentCollectiviteBloc,
  CurrentCollectiviteObserved,
} from '../../../core-logic/observables';
import Header from './Header';
import {HeaderObserver} from './Header';

export default {
  component: Header,
};

const collectivite: CurrentCollectiviteObserved | null = {
  nom: 'Collectivité 1',
  collectivite_id: 1,
  role_name: 'agent',
};

const collectiviteNotMember: CurrentCollectiviteObserved | null = {
  nom: 'Collectivité 1',
  collectivite_id: 1,
  role_name: null,
};

const ownedOneCollectivite: CurrentCollectiviteObserved[] = [
  {
    nom: 'Collectivité 1',
    collectivite_id: 1,
    role_name: null,
  },
];

const ownedCollectivites: CurrentCollectiviteObserved[] = [
  {
    nom: 'Collectivité 1',
    collectivite_id: 1,
    role_name: null,
  },
  {
    nom: 'Collectivité 2',
    collectivite_id: 2,
    role_name: null,
  },
  {
    nom: 'Collectivité 3',
    collectivite_id: 3,
    role_name: null,
  },
];

export const NotConnected = () => (
  <HeaderObserver
    authBloc={authBloc}
    currentCollectiviteBloc={currentCollectiviteBloc}
    isConnected={false}
    collectivite={null}
    ownedCollectivite={null}
  />
);
export const Connected = () => (
  <HeaderObserver
    authBloc={authBloc}
    currentCollectiviteBloc={currentCollectiviteBloc}
    isConnected
    collectivite={null}
    ownedCollectivite={null}
  />
);
export const WithOneCollectivite = () => (
  <HeaderObserver
    authBloc={authBloc}
    currentCollectiviteBloc={currentCollectiviteBloc}
    isConnected
    collectivite={collectivite}
    ownedCollectivite={ownedOneCollectivite}
  />
);
export const WithCollectivites = () => (
  <HeaderObserver
    authBloc={authBloc}
    currentCollectiviteBloc={currentCollectiviteBloc}
    isConnected
    collectivite={collectivite}
    ownedCollectivite={ownedCollectivites}
  />
);
export const WithCollectiviteNotMember = () => (
  <HeaderObserver
    authBloc={authBloc}
    currentCollectiviteBloc={currentCollectiviteBloc}
    isConnected
    collectivite={collectiviteNotMember}
    ownedCollectivite={[collectiviteNotMember]}
  />
);
