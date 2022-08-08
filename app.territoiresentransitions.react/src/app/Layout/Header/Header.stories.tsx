import React from 'react';
import {action} from '@storybook/addon-actions';

import {Header} from './Header';

export default {
  component: Header,
};

const baseAuth = {
  connect: action('connect'),
  disconnect: action('disconnect'),
  authError: null,
};

const notConnectedAuth = {
  ...baseAuth,
  user: null,
  isConnected: false,
};

const connectedAuth = {
  ...baseAuth,
  user: {
    id: '1',
    nom: 'Dodo',
    prenom: 'Yolo',
  },
  isConnected: true,
};

const currentCollectivite = {
  collectivite_id: 1,
  nom: 'Collectivité test',
  niveau_acces: 'admin',
  isAdmin: true,
  readonly: false,
};

const ownedCollectivites = [
  {
    collectivite_id: 2,
    nom: 'Collectivité test 2',
    niveau_acces: 'edition',
    isAdmin: false,
    readonly: false,
  },
  {
    collectivite_id: 3,
    nom: 'Collectivité test 3',
    niveau_acces: 'lecture',
    isAdmin: false,
    readonly: true,
  },
];

export const NotConnected = () => (
  <Header
    auth={notConnectedAuth}
    currentCollectivite={null}
    ownedCollectivites={null}
    maintenance={null}
  />
);

export const Connected = () => (
  <Header
    auth={connectedAuth}
    currentCollectivite={currentCollectivite}
    ownedCollectivites={ownedCollectivites}
    maintenance={null}
  />
);
