import {Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {fakeAdmin, fakeEditeur, fakeLecteur} from './fakeData';
import MembreListTableRow from './MembreListTableRow';
import {TUpdateMembre} from '../types';

export default {
  component: MembreListTableRow,
  args: {
    updateMembre: action('updateMembre') as TUpdateMembre,
    removeFromCollectivite: action('removeFromCollectivite'),
    resendInvitation: action('resendInvitation'),
  },
} as Meta;

export const Admin = {
  args: {
    currentUserId: fakeAdmin.user_id,
    membre: fakeAdmin,
    currentUserAccess: 'admin',
  },
};

export const Editeur = {
  args: {
    currentUserId: fakeEditeur.user_id,
    membre: fakeEditeur,
    currentUserAccess: 'edition',
  },
};

export const Lecteur = {
  args: {
    currentUserId: fakeLecteur.user_id,
    membre: fakeLecteur,
    currentUserAccess: 'lecture',
  },
};

export const Invite = {
  args: {
    currentUserId: '5',
    membre: {email: 'invite@dodo.com', niveau_acces: 'lecture'},
    currentUserAccess: 'lecture',
  },
};
