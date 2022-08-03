import React from 'react';
import InvitationForm from './InvitationForm';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

export default {
  component: InvitationForm,
};

const fakeCollectivite: CurrentCollectivite = {
  collectivite_id: 1,
  nom: 'Fake Collectivite',
  role_name: null,
  isReferent: false,
  readonly: false,
};

const fakeCurrentAdmin = {
  nom: 'Yolo',
  prenom: 'Dodo',
  email: 'yolo@dodo.com',
  acces: 'admin',
};

const fakeCurrentEditeur = {
  nom: 'Yala',
  prenom: 'Dada',
  email: 'yala@dada.com',
  acces: 'edition',
};

export const AsAdmin = () => (
  <InvitationForm
    currentCollectivite={fakeCollectivite}
    currentUser={fakeCurrentAdmin}
    addUser={() => {}}
    addUserResponse={{}}
  />
);

export const AsEditeur = () => (
  <InvitationForm
    currentCollectivite={fakeCollectivite}
    currentUser={fakeCurrentEditeur}
    addUser={() => {}}
    addUserResponse={{}}
  />
);
