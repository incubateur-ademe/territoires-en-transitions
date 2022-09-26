import React from 'react';
import {Story, Meta} from '@storybook/react';
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

const Template: Story<TMembreListTableRowProps> = args => (
  <MembreListTableRow {...args} />
);

export const Admin = Template.bind({});
const AdminArgs: TMembreListTableRowProps = {
  currentUserId: fakeAdmin.user_id,
  membre: fakeAdmin,
  currentUserAccess: 'admin',
  ...handlers,
};
Admin.args = AdminArgs;

export const Editeur = Template.bind({});
const EditeurArgs: TMembreListTableRowProps = {
  currentUserId: fakeEditeur.user_id,
  membre: fakeEditeur,
  currentUserAccess: 'edition',
  ...handlers,
};
Editeur.args = EditeurArgs;

export const Lecteur = Template.bind({});
const LecteurArgs: TMembreListTableRowProps = {
  currentUserId: fakeLecteur.user_id,
  membre: fakeLecteur,
  currentUserAccess: 'lecture',
  ...handlers,
};
Lecteur.args = LecteurArgs;

export const Invite = Template.bind({});
const InviteArgs: TMembreListTableRowProps = {
  currentUserId: '5',
  membre: {email: 'invite@dodo.com', niveau_acces: 'lecture'},
  currentUserAccess: 'lecture',
  ...handlers,
};
Invite.args = InviteArgs;
