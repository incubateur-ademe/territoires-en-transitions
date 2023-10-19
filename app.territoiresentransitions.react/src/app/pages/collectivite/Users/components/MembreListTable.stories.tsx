import { Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {TUpdateMembre} from '../types';
import MembreListTable, {MembreListTableProps} from './MembreListTable';
import {fakeAdmin, fakeEditeur, fakeLecteur, fakeMembres} from './fakeData';

export default {
  component: MembreListTable,
} as Meta;

const handlers = {
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
};

export const AsAdmin = {
  args: AsAdminArgs,
};

const AsAdminArgs: MembreListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeAdmin.user_id,
  currentUserAccess: 'admin',
  isLoading: false,
  ...handlers,
};

export const AsEditeur = {
  args: AsEditeurArgs,
};

const AsEditeurArgs: MembreListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeEditeur.user_id,
  currentUserAccess: 'edition',
  isLoading: false,
  ...handlers,
};

export const AsLecteur = {
  args: AsLecteurArgs,
};

const AsLecteurArgs: MembreListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeLecteur.user_id,
  currentUserAccess: 'lecture',
  isLoading: false,
  ...handlers,
};

export const IsLoading = {
  args: IsLoadingArgs,
};

const IsLoadingArgs: MembreListTableProps = {
  currentUserId: fakeAdmin.user_id,
  currentUserAccess: 'admin',
  isLoading: true,
  ...handlers,
};

export const Empty = {
  args: EmptyArgs,
};

const EmptyArgs: MembreListTableProps = {
  currentUserId: fakeAdmin.user_id,
  currentUserAccess: 'admin',
  isLoading: false,
  ...handlers,
};
