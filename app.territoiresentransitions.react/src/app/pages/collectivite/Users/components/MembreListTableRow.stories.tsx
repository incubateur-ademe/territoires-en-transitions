import {Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {fakeAdmin, fakeEditeur, fakeLecteur} from './fakeData';
import MembreListTableRow, {
  TMembreListTableRowProps,
} from './MembreListTableRow';
import {TUpdateMembre} from '../types';

export default {
  component: MembreListTableRow,
} as Meta;

const handlers = {
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
};

const AdminArgs: TMembreListTableRowProps = {
  currentUserId: fakeAdmin.user_id,
  membre: fakeAdmin,
  currentUserAccess: 'admin',
  ...handlers,
};

export const Admin = {
  args: AdminArgs,
};

const EditeurArgs: TMembreListTableRowProps = {
  currentUserId: fakeEditeur.user_id,
  membre: fakeEditeur,
  currentUserAccess: 'edition',
  ...handlers,
};

export const Editeur = {
  args: EditeurArgs,
};

const LecteurArgs: TMembreListTableRowProps = {
  currentUserId: fakeLecteur.user_id,
  membre: fakeLecteur,
  currentUserAccess: 'lecture',
  ...handlers,
};

export const Lecteur = {
  args: LecteurArgs,
};

const InviteArgs: TMembreListTableRowProps = {
  currentUserId: '5',
  membre: {email: 'invite@dodo.com', niveau_acces: 'lecture'},
  currentUserAccess: 'lecture',
  ...handlers,
};

export const Invite = {
  args: InviteArgs,
};
