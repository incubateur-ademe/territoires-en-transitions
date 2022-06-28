import {action} from '@storybook/addon-actions';
import {Header} from './Header';
import {CurrentCollectivite} from '../../../core-logic/hooks/useCurrentCollectivite';

export default {
  component: Header,
};

const authDisconnected = {
  isConnected: false,
  user: null,
  authError: null,
  connect: action('connect'),
  disconnect: action('disconnect'),
};

const authConnected = {
  ...authDisconnected,
  isConnected: true,
  user: {email: 'emeline@beta.gouv.fr'},
};

const readonlyCollectivite: CurrentCollectivite = {
  nom: 'Test collectivite',
  collectivite_id: 1,
  role_name: null,
  isReferent: false,
  readonly: true,
};

const ownedCollectivite: CurrentCollectivite = {
  nom: 'Test collectivite',
  collectivite_id: 1,
  role_name: 'referent',
  isReferent: true,
  readonly: false,
};

export const NotConnected = () => (
  <Header auth={authDisconnected} currentCollectivite={null} />
);

export const Connected = () => (
  <Header auth={authConnected} currentCollectivite={null} />
);

export const WithCollectivite = () => (
  <Header auth={authConnected} currentCollectivite={ownedCollectivite} />
);

export const WithReadonlyCollectivite = () => (
  <Header auth={authConnected} currentCollectivite={readonlyCollectivite} />
);
