import {Story, Meta} from '@storybook/react';
import {fakeAdmin, fakeEditeur, fakeLecteur, fakeUsers} from './fakeData';
import UserListTable, {UserListTableProps} from './UserListTable';

export default {
  component: UserListTable,
} as Meta;

const Template: Story<UserListTableProps> = args => <UserListTable {...args} />;

export const AsAdmin = Template.bind({});
const AsAdminArgs: UserListTableProps = {
  currentUser: fakeAdmin,
  users: fakeUsers,
  isLoading: false,
};
AsAdmin.args = AsAdminArgs;

export const AsEditeur = Template.bind({});
const AsEditeurArgs: UserListTableProps = {
  currentUser: fakeEditeur,
  users: fakeUsers,
  isLoading: false,
};
AsEditeur.args = AsEditeurArgs;

export const AsLecteur = Template.bind({});
const AsLecteurArgs: UserListTableProps = {
  currentUser: fakeLecteur,
  users: fakeUsers,
  isLoading: false,
};
AsLecteur.args = AsLecteurArgs;

export const TODOWithGuest = Template.bind({});
const TODOWithGuestArgs: UserListTableProps = {
  currentUser: fakeLecteur,
  users: fakeUsers,
  isLoading: false,
};
TODOWithGuest.args = TODOWithGuestArgs;

export const isLoading = Template.bind({});
const isLoadingArgs: UserListTableProps = {
  currentUser: fakeAdmin,
  isLoading: true,
};
isLoading.args = isLoadingArgs;

export const Empty = Template.bind({});
const EmptyArgs: UserListTableProps = {
  currentUser: fakeAdmin,
  isLoading: false,
};
Empty.args = EmptyArgs;
