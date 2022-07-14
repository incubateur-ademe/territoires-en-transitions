import {action} from '@storybook/addon-actions';
import {Header} from './Header';
import {CurrentCollectivite} from '../../../core-logic/hooks/useCurrentCollectivite';
import {Maintenance} from '../useMaintenance';
import React from 'react';

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
  user: {prenom: 'Émeline'},
};

const readonlyCollectivite: CurrentCollectivite = {
  nom: 'Test collectivite',
  collectivite_id: 1,
  niveau_acces: null,
  isAdmin: false,
  readonly: true,
};

const currentCollectivite: CurrentCollectivite = {
  nom: 'Test collectivite',
  collectivite_id: 1,
  niveau_acces: 'admin',
  isAdmin: true,
  readonly: false,
};

const upcomingMaintenance: Maintenance = {
  now: '2022-06-27T08:15:14.600604+00:00',
  begins_at: '2022-06-27T10:15:14.600604+00:00',
  ends_at: '2022-06-27T10:30:14.600604+00:00',
};

const ongoingMaintenance: Maintenance = {
  now: '2022-06-27T10:19:14.600604+00:00',
  begins_at: '2022-06-27T10:15:14.600604+00:00',
  ends_at: '2022-06-27T10:30:14.600604+00:00',
};

export const NotConnected = () => (
  <Header
    auth={authDisconnected}
    currentCollectivite={null}
    ownedCollectivites={null}
    maintenance={null}
  />
);

export const Connected = () => (
  <Header
    auth={authConnected}
    currentCollectivite={null}
    ownedCollectivites={null}
    maintenance={null}
  />
);

export const WithCollectivite = () => (
  <Header
    auth={authConnected}
    currentCollectivite={currentCollectivite}
    ownedCollectivites={[currentCollectivite]}
    maintenance={null}
  />
);

export const WithReadonlyCollectivite = () => (
  <Header
    auth={authConnected}
    currentCollectivite={readonlyCollectivite}
    ownedCollectivites={[]}
    maintenance={null}
  />
);

export const WithUpcomingMaintenance = () => (
  <Header
    auth={authConnected}
    currentCollectivite={readonlyCollectivite}
    ownedCollectivites={[]}
    maintenance={upcomingMaintenance}
  />
);

export const WithOngoingMaintenance = () => (
  <Header
    auth={authConnected}
    currentCollectivite={readonlyCollectivite}
    ownedCollectivites={[]}
    maintenance={ongoingMaintenance}
  />
);
