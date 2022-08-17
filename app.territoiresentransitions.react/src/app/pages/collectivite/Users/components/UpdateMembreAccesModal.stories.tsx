import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {TUpdateMembre} from '../types';
import UpdateMembreAccesModal, {
  AccesModalProps,
} from './UpdateMembreAccesModal';

export default {
  component: UpdateMembreAccesModal,
} as Meta;

const Template: Story<AccesModalProps> = args => (
  <UpdateMembreAccesModal {...args} />
);

const handlers = {
  setIsOpen: action('setIsOpen'),
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
  removeInvite: action('removeInvite'),
};

export const AdminRetireUnMembre = Template.bind({});
const AdminRetireUnMembreArgs: AccesModalProps = {
  isOpen: true,
  selectedOption: 'remove',
  membreId: '1',
  membreEmail: '',
  isCurrentUser: false,
  ...handlers,
};
AdminRetireUnMembre.args = AdminRetireUnMembreArgs;

export const AdminRetireUnInvite = Template.bind({});
const AdminRetireUnInviteArgs: AccesModalProps = {
  isOpen: true,
  selectedOption: 'remove',
  membreId: null,
  membreEmail: '',
  isCurrentUser: false,
  ...handlers,
};
AdminRetireUnInvite.args = AdminRetireUnInviteArgs;

export const AdminSeRetireLuiMeme = Template.bind({});
const AdminSeRetireLuiMemeArgs: AccesModalProps = {
  isOpen: true,
  selectedOption: 'remove',
  membreId: '1',
  membreEmail: '',
  isCurrentUser: true,
  ...handlers,
};
AdminSeRetireLuiMeme.args = AdminSeRetireLuiMemeArgs;

export const AdminChangeSonAcces = Template.bind({});
const AdminChangeSonAccesArgs: AccesModalProps = {
  isOpen: true,
  selectedOption: 'edition',
  membreId: '1',
  membreEmail: '',
  isCurrentUser: true,
  ...handlers,
};
AdminChangeSonAcces.args = AdminChangeSonAccesArgs;
