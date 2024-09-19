import { action } from '@storybook/addon-actions';

import { Membres, MembresProps } from './Membres';

import { fakeUserData } from '../../../../fixtures/userData';
import {
  fakeCurrentCollectiviteAdmin,
  fakeCurrentCollectiviteLecture,
} from '../../../../fixtures/currentCollectivite';
import { fakeMembres } from './components/fakeData';
import { TUpdateMembre } from './types';

export default {
  component: Membres,
};

const handlers = {
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
};

const EnTantQueLecteurArgs: MembresProps = {
  addUser: async () => null,
  addUserResponse: {},
  currentUser: { ...fakeUserData, id: '3' },
  membres: fakeMembres,
  isLoading: false,
  collectivite: fakeCurrentCollectiviteLecture,
  ...handlers,
};

export const EnTantQueLecteur = {
  args: EnTantQueLecteurArgs,
};

const EnTantQuAdminQuiInviteUnNouvelUtilisateurArgs: MembresProps = {
  addUser: async (_request) => undefined,
  addUserResponse: { added: false, invitationUrl: 'invitationId' },
  currentUser: fakeUserData,
  membres: fakeMembres,
  isLoading: false,
  collectivite: fakeCurrentCollectiviteAdmin,
  ...handlers,
};

export const EnTantQuAdminQuiInviteUnNouvelUtilisateur = {
  args: EnTantQuAdminQuiInviteUnNouvelUtilisateurArgs,
};

const EnTantQuAdminQuiInviteUnUtilisateurExistantArgs: MembresProps = {
  addUserResponse: { added: true },
  currentUser: fakeUserData,
  membres: fakeMembres,
  isLoading: false,
  collectivite: fakeCurrentCollectiviteAdmin,
  ...handlers,
};

export const EnTantQuAdminQuiInviteUnUtilisateurExistant = {
  args: EnTantQuAdminQuiInviteUnUtilisateurExistantArgs,
};

const EnTantQuAdminQuiInviteUnUtilisateurDejaMembreArgs: MembresProps = {
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

export const EnTantQuAdminQuiInviteUnUtilisateurDejaMembre = {
  args: EnTantQuAdminQuiInviteUnUtilisateurDejaMembreArgs,
};
