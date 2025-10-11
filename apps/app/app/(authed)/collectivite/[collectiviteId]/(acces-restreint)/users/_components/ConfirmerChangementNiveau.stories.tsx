import { UpdateMembresFunction } from '@/app/referentiels/tableau-de-bord/referents/useUpdateMembres';
import { Meta } from '@storybook/nextjs';
import { action } from 'storybook/actions';
import { ConfirmerChangementNiveau } from './ConfirmerChangementNiveau';

export default {
  component: ConfirmerChangementNiveau,
} as Meta;

const handlers = {
  setIsOpen: action('setIsOpen'),
  updateMembre: action('updateMembre') as UpdateMembresFunction,
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
