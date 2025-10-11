import { Meta } from '@storybook/nextjs';
import { action } from 'storybook/actions';
import {
  fakeAdmin,
  fakeEditeur,
  fakeLecteur,
} from '../../_components/fakeData';
import MembreListTable, { MembreListTableProps } from './MembreListTable';

export default {
  component: MembreListTable,
} as Meta;

const handlers = {
  sendInvitation: action('sendInvitation'),
};

const AsAdminArgs: MembreListTableProps = {
  collectiviteId: 1,
  currentUserId: fakeAdmin.userId,
  currentUserAccess: 'admin',
  ...handlers,
};

export const AsAdmin = {
  args: AsAdminArgs,
};

const AsEditeurArgs: MembreListTableProps = {
  collectiviteId: 1,
  currentUserId: fakeEditeur.userId,
  currentUserAccess: 'edition',
  ...handlers,
};

export const AsEditeur = {
  args: AsEditeurArgs,
};

const AsLecteurArgs: MembreListTableProps = {
  collectiviteId: 1,
  currentUserId: fakeLecteur.userId,
  currentUserAccess: 'lecture',
  ...handlers,
};

export const AsLecteur = {
  args: AsLecteurArgs,
};

const IsLoadingArgs: MembreListTableProps = {
  collectiviteId: 1,
  currentUserId: fakeAdmin.userId,
  currentUserAccess: 'admin',
  ...handlers,
};

export const IsLoading = {
  args: IsLoadingArgs,
};

const EmptyArgs: MembreListTableProps = {
  collectiviteId: 1,
  currentUserId: fakeAdmin.userId,
  currentUserAccess: 'admin',
  ...handlers,
};

export const Empty = {
  args: EmptyArgs,
};
