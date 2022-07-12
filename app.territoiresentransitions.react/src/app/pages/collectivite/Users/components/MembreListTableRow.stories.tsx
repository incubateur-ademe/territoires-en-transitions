import {Story, Meta} from '@storybook/react';
import React from 'react';
import {fakeAdmin, fakeEditeur, fakeLecteur} from './fakeData';
import MembreListTableRow, {
  TMembreListTableRowProps,
} from './MembreListTableRow';

export default {
  component: MembreListTableRow,
} as Meta;

const Template: Story<TMembreListTableRowProps> = args => (
  <MembreListTableRow {...args} />
);

export const Admin = Template.bind({});
const AdminArgs: TMembreListTableRowProps = {
  updateMembreFonction: fonction => {
    console.log(fonction);
  },
  currentUserId: fakeAdmin.user_id,
  membre: fakeAdmin,
  currentUserAccess: 'admin',
};
Admin.args = AdminArgs;

export const Editeur = Template.bind({});
const EditeurArgs: TMembreListTableRowProps = {
  updateMembreFonction: fonction => {
    console.log(fonction);
  },
  currentUserId: fakeEditeur.user_id,
  membre: fakeEditeur,
  currentUserAccess: 'edition',
};
Editeur.args = EditeurArgs;

export const Lecteur = Template.bind({});
const LecteurArgs: TMembreListTableRowProps = {
  updateMembreFonction: fonction => {
    console.log(fonction);
  },
  currentUserId: fakeLecteur.user_id,
  membre: fakeLecteur,
  currentUserAccess: 'lecture',
};
Lecteur.args = LecteurArgs;

export const TODOGuest = Template.bind({});
const TODOGuestArgs: TMembreListTableRowProps = {
  updateMembreFonction: fonction => {
    console.log(fonction);
  },
  currentUserId: fakeLecteur.user_id,
  membre: fakeLecteur,
  currentUserAccess: 'lecture',
};
TODOGuest.args = TODOGuestArgs;
