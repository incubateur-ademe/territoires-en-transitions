import { action } from '@storybook/addon-actions';
import { Meta } from '@storybook/react';
import { TUpdateMembre } from '../../../../../../../src/app/pages/collectivite/Users/types';
import { ConfirmerChangementNiveau } from './ConfirmerChangementNiveau';

export default {
  component: ConfirmerChangementNiveau,
} as Meta;

const handlers = {
  setIsOpen: action('setIsOpen'),
  updateMembre: action('updateMembre') as TUpdateMembre,
};

export const AdminChangeSonAcces = {
  args: {
    isOpen: true,
    selectedOption: 'edition',
    membre: { user_id: '1', email: '' },
    isCurrentUser: true,
    ...handlers,
  },
};
