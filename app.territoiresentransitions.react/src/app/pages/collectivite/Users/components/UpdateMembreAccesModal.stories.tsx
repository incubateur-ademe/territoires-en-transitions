import { Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {TUpdateMembre} from '../types';
import UpdateMembreAccesModal, {
  AccesModalProps,
} from './UpdateMembreAccesModal';

export default {
  component: UpdateMembreAccesModal,
  parameters: {storyshots: false},
} as Meta;

const handlers = {
  setIsOpen: action('setIsOpen'),
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
  removeInvite: action('removeInvite'),
};

export const AdminRetireUnMembre = {
  args: AdminRetireUnMembreArgs,
};

const AdminRetireUnMembreArgs: AccesModalProps = {
  isOpen: true,
  selectedOption: 'remove',
  membreId: '1',
  membreEmail: '',
  isCurrentUser: false,
  ...handlers,
};

export const AdminRetireUnInvite = {
  args: AdminRetireUnInviteArgs,
};

const AdminRetireUnInviteArgs: AccesModalProps = {
  isOpen: true,
  selectedOption: 'remove',
  membreId: null,
  membreEmail: '',
  isCurrentUser: false,
  ...handlers,
};

export const AdminSeRetireLuiMeme = {
  args: AdminSeRetireLuiMemeArgs,
};

const AdminSeRetireLuiMemeArgs: AccesModalProps = {
  isOpen: true,
  selectedOption: 'remove',
  membreId: '1',
  membreEmail: '',
  isCurrentUser: true,
  ...handlers,
};

export const AdminChangeSonAcces = {
  args: AdminChangeSonAccesArgs,
};

const AdminChangeSonAccesArgs: AccesModalProps = {
  isOpen: true,
  selectedOption: 'edition',
  membreId: '1',
  membreEmail: '',
  isCurrentUser: true,
  ...handlers,
};
