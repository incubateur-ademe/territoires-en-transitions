import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {TUpdateMembre} from '../types';
import {fakeAdmin, fakeEditeur, fakeLecteur, fakeMembres} from './fakeData';
import UserListTable, {UserListTableProps} from './MembreListTable';

export default {
  component: UserListTable,
} as Meta;

const Template: Story<UserListTableProps> = args => <UserListTable {...args} />;

const handlers = {
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
};

export const AsAdmin = Template.bind({});
const AsAdminArgs: UserListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeAdmin.user_id,
  isLoading: false,
  ...handlers,
};
AsAdmin.args = AsAdminArgs;

export const AsEditeur = Template.bind({});
const AsEditeurArgs: UserListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeEditeur.user_id,
  isLoading: false,
  ...handlers,
};
AsEditeur.args = AsEditeurArgs;

export const AsLecteur = Template.bind({});
const AsLecteurArgs: UserListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeLecteur.user_id,
  isLoading: false,
  ...handlers,
};
AsLecteur.args = AsLecteurArgs;

export const TODOWithGuest = Template.bind({});
const TODOWithGuestArgs: UserListTableProps = {
  currentUserId: fakeLecteur.user_id,
  isLoading: false,
  ...handlers,
};
TODOWithGuest.args = TODOWithGuestArgs;

export const isLoading = Template.bind({});
const isLoadingArgs: UserListTableProps = {
  currentUserId: fakeAdmin.user_id,
  isLoading: true,
  ...handlers,
};
isLoading.args = isLoadingArgs;

export const Empty = Template.bind({});
const EmptyArgs: UserListTableProps = {
  currentUserId: fakeAdmin.user_id,
  isLoading: false,
  ...handlers,
};
Empty.args = EmptyArgs;
