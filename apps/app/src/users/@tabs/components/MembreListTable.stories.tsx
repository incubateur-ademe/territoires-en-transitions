import { Meta } from '@storybook/nextjs';
import { action } from 'storybook/actions';
import { TUpdateMembre } from '../../../app/pages/collectivite/Users/types';
import {
  fakeAdmin,
  fakeEditeur,
  fakeLecteur,
  fakeMembres,
} from '../components/fakeData';
import MembreListTable, { MembreListTableProps } from './MembreListTable';

export default {
  component: MembreListTable,
} as Meta;

const handlers = {
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
};

const AsAdminArgs: MembreListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeAdmin.user_id,
  currentUserAccess: 'admin',
  isLoading: false,
  ...handlers,
};

export const AsAdmin = {
  args: AsAdminArgs,
};

const AsEditeurArgs: MembreListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeEditeur.user_id,
  currentUserAccess: 'edition',
  isLoading: false,
  ...handlers,
};

export const AsEditeur = {
  args: AsEditeurArgs,
};

const AsLecteurArgs: MembreListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeLecteur.user_id,
  currentUserAccess: 'lecture',
  isLoading: false,
  ...handlers,
};

export const AsLecteur = {
  args: AsLecteurArgs,
};

const IsLoadingArgs: MembreListTableProps = {
  currentUserId: fakeAdmin.user_id,
  currentUserAccess: 'admin',
  isLoading: true,
  ...handlers,
};

export const IsLoading = {
  args: IsLoadingArgs,
};

const EmptyArgs: MembreListTableProps = {
  currentUserId: fakeAdmin.user_id,
  currentUserAccess: 'admin',
  isLoading: false,
  ...handlers,
};

export const Empty = {
  args: EmptyArgs,
};
