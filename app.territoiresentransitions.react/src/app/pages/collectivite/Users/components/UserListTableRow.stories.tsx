import {Story, Meta} from '@storybook/react';
import {fakeAdmin, fakeEditeur, fakeLecteur} from './fakeData';
import UserListTableRow, {UserListTableRowProps} from './UserListTableRow';

export default {
  component: UserListTableRow,
} as Meta;

const Template: Story<UserListTableRowProps> = args => (
  <UserListTableRow {...args} />
);

export const Admin = Template.bind({});
const AdminArgs: UserListTableRowProps = {
  currentUser: fakeAdmin,
  user: fakeAdmin,
};
Admin.args = AdminArgs;

export const Editeur = Template.bind({});
const EditeurArgs: UserListTableRowProps = {
  currentUser: fakeEditeur,
  user: fakeEditeur,
};
Editeur.args = EditeurArgs;

export const Lecteur = Template.bind({});
const LecteurArgs: UserListTableRowProps = {
  currentUser: fakeLecteur,
  user: fakeLecteur,
};
Lecteur.args = LecteurArgs;

export const TODOGuest = Template.bind({});
const TODOGuestArgs: UserListTableRowProps = {
  currentUser: fakeLecteur,
  user: fakeLecteur,
};
TODOGuest.args = TODOGuestArgs;
