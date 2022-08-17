import React from 'react';
import {Story} from '@storybook/react';
import {action} from '@storybook/addon-actions';

import {Membres, MembresProps} from './Membres';

import {fakeUserData} from '../../../../fixtures/userData';
import {
  fakeCurrentCollectiviteAdmin,
  fakeCurrentCollectiviteLecture,
} from '../../../../fixtures/currentCollectivite';
import {fakeMembres} from './components/fakeData';
import {TUpdateMembre} from './types';

export default {
  component: Membres,
};

const Template: Story<MembresProps> = args => <Membres {...args} />;

const handlers = {
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
};

export const EnTantQueLecteur = Template.bind({});
const EnTantQueLecteurArgs: MembresProps = {
  addUser: async _request => null,
  addUserResponse: {},
  currentUser: {...fakeUserData, id: '3'},
  membres: fakeMembres,
  isLoading: false,
  collectivite: fakeCurrentCollectiviteLecture,
  ...handlers,
};
EnTantQueLecteur.args = EnTantQueLecteurArgs;

export const EnTantQuAdminQuiInviteUnNouvelUtilisateur = Template.bind({});
const EnTantQuAdminQuiInviteUnNouvelUtilisateurArgs: MembresProps = {
  addUser: async _request => undefined,
  addUserResponse: {added: false, invitationUrl: 'invitationId'},
  currentUser: fakeUserData,
  membres: fakeMembres,
  isLoading: false,
  collectivite: fakeCurrentCollectiviteAdmin,
  ...handlers,
};
EnTantQuAdminQuiInviteUnNouvelUtilisateur.args =
  EnTantQuAdminQuiInviteUnNouvelUtilisateurArgs;

export const EnTantQuAdminQuiInviteUnUtilisateurExistant = Template.bind({});
const EnTantQuAdminQuiInviteUnUtilisateurExistantArgs: MembresProps = {
  addUser: async _request => undefined,
  addUserResponse: {added: true},
  currentUser: fakeUserData,
  membres: fakeMembres,
  isLoading: false,
  collectivite: fakeCurrentCollectiviteAdmin,
  ...handlers,
};
EnTantQuAdminQuiInviteUnUtilisateurExistant.args =
  EnTantQuAdminQuiInviteUnUtilisateurExistantArgs;

export const EnTantQuAdminQuiInviteUnUtilisateurDejaMembre = Template.bind({});
const EnTantQuAdminQuiInviteUnUtilisateurDejaMembreArgs: MembresProps = {
  addUser: async _ => undefined,
  addUserResponse: {
    added: false,
    error: 'Cet utilisateur est déjà membre de la collectivité',
  },
  currentUser: fakeUserData,
  membres: fakeMembres,
  isLoading: false,
  collectivite: fakeCurrentCollectiviteAdmin,
  ...handlers,
};
EnTantQuAdminQuiInviteUnUtilisateurDejaMembre.args =
  EnTantQuAdminQuiInviteUnUtilisateurDejaMembreArgs;
