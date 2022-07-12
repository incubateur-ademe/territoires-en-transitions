import {Story, Meta} from '@storybook/react';
import React from 'react';
import {fakeAdmin, fakeEditeur, fakeLecteur, fakeMembres} from './fakeData';
import UserListTable, {UserListTableProps} from './MembreListTable';

export default {
  component: UserListTable,
} as Meta;

const Template: Story<UserListTableProps> = args => <UserListTable {...args} />;

const logOnUpdate = (user_id, update: any) => {
  console.log('update user ', user_id, ' => ', update);
};

export const AsAdmin = Template.bind({});
const AsAdminArgs: UserListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeAdmin.user_id,
  isLoading: false,
  updateMembreFonction: logOnUpdate,
};
AsAdmin.args = AsAdminArgs;

export const AsEditeur = Template.bind({});
const AsEditeurArgs: UserListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeEditeur.user_id,
  isLoading: false,
  updateMembreFonction: logOnUpdate,
};
AsEditeur.args = AsEditeurArgs;

export const AsLecteur = Template.bind({});
const AsLecteurArgs: UserListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeLecteur.user_id,
  isLoading: false,
  updateMembreFonction: logOnUpdate,
};
AsLecteur.args = AsLecteurArgs;

export const TODOWithGuest = Template.bind({});
const TODOWithGuestArgs: UserListTableProps = {
  currentUserId: fakeLecteur.user_id,
  isLoading: false,
  updateMembreFonction: logOnUpdate,
};
TODOWithGuest.args = TODOWithGuestArgs;

export const isLoading = Template.bind({});
const isLoadingArgs: UserListTableProps = {
  currentUserId: fakeAdmin.user_id,
  isLoading: true,
  updateMembreFonction: logOnUpdate,
};
isLoading.args = isLoadingArgs;

export const Empty = Template.bind({});
const EmptyArgs: UserListTableProps = {
  currentUserId: fakeAdmin.user_id,
  isLoading: false,
  updateMembreFonction: logOnUpdate,
};
Empty.args = EmptyArgs;
