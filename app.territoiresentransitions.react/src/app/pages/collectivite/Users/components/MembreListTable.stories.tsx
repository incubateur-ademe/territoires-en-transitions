import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {TUpdateMembre} from '../types';
import MembreListTable, {MembreListTableProps} from './MembreListTable';
import {fakeAdmin, fakeEditeur, fakeLecteur, fakeMembres} from './fakeData';

export default {
  component: MembreListTable,
} as Meta;

const Template: Story<MembreListTableProps> = args => (
  <MembreListTable {...args} />
);

const handlers = {
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
};

export const AsAdmin = Template.bind({});
const AsAdminArgs: MembreListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeAdmin.user_id,
  currentUserAccess: 'admin',
  isLoading: false,
  ...handlers,
};
AsAdmin.args = AsAdminArgs;

export const AsEditeur = Template.bind({});
const AsEditeurArgs: MembreListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeEditeur.user_id,
  currentUserAccess: 'edition',
  isLoading: false,
  ...handlers,
};
AsEditeur.args = AsEditeurArgs;

export const AsLecteur = Template.bind({});
const AsLecteurArgs: MembreListTableProps = {
  membres: fakeMembres,
  currentUserId: fakeLecteur.user_id,
  currentUserAccess: 'lecture',
  isLoading: false,
  ...handlers,
};
AsLecteur.args = AsLecteurArgs;

export const isLoading = Template.bind({});
const isLoadingArgs: MembreListTableProps = {
  currentUserId: fakeAdmin.user_id,
  currentUserAccess: 'admin',
  isLoading: true,
  ...handlers,
};
isLoading.args = isLoadingArgs;

export const Empty = Template.bind({});
const EmptyArgs: MembreListTableProps = {
  currentUserId: fakeAdmin.user_id,
  currentUserAccess: 'admin',
  isLoading: false,
  ...handlers,
};
Empty.args = EmptyArgs;
