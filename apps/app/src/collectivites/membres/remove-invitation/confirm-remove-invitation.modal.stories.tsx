import { Meta } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { ConfirmerSuppressionInvitation } from './confirm-remove-invitation.modal';

export default {
  component: ConfirmerSuppressionInvitation,
  args: {
    setIsOpen: action('setIsOpen'),
  },
} as Meta;

export const AnnulerInvitation = {
  args: {
    isOpen: true,
    email: 'invite@example.com',
  },
};
