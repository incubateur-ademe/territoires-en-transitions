import { Meta } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { ConfirmerChangementNiveau } from './ConfirmerChangementNiveau';

export default {
  component: ConfirmerChangementNiveau,
} as Meta;

const handlers = {
  setIsOpen: action('setIsOpen'),
  updateMembre: action('updateMembre') as () => void,
};

export const AdminChangeSonAcces = {
  args: {
    isOpen: true,
    selectedOption: 'edition',
    membre: { userId: '1', email: '' },
    isCurrentUser: true,
    ...handlers,
  },
};
