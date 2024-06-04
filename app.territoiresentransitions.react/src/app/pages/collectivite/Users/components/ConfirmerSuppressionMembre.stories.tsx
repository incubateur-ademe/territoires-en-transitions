import {Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {ConfirmerSuppressionMembre} from './ConfirmerSuppressionMembre';

export default {
  component: ConfirmerSuppressionMembre,
  parameters: {storyshots: false},
  args: {
    setIsOpen: action('setIsOpen'),
    updateMembre: action('updateMembre'),
    removeFromCollectivite: action('removeFromCollectivite'),
    removeInvite: action('removeInvite'),
  },
} as Meta;

export const AdminRetireUnMembre = {
  args: {
    isOpen: true,
    selectedOption: 'remove',
    membre: {user_id: '1', email: ''},
    isCurrentUser: false,
  },
};

export const AdminRetireUnInvite = {
  args: {
    isOpen: true,
    selectedOption: 'remove',
    membre: null,
    isCurrentUser: false,
  },
};

export const AdminSeRetireLuiMeme = {
  args: {
    isOpen: true,
    selectedOption: 'remove',
    membre: {user_id: '1', email: ''},
    isCurrentUser: true,
  },
};
