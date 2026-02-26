import { Meta } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { ConfirmerSuppressionMembre } from './confirm-remove-membre.modal';

const membreMock = {
  userId: '1',
  email: 'jean.dupont@example.com',
  nom: 'Dupont',
  prenom: 'Jean',
  role: 'admin' as const,
  telephone: null,
  fonction: null,
  detailsFonction: null,
  champIntervention: null,
  estReferent: null,
  createdAt: '2024-01-01T00:00:00Z',
};

export default {
  component: ConfirmerSuppressionMembre,
  args: {
    setIsOpen: action('setIsOpen'),
  },
} as Meta;

export const AdminRetireUnMembre = {
  args: {
    isOpen: true,
    membre: membreMock,
    isCurrentUser: false,
  },
};

export const AdminSeRetireLuiMeme = {
  args: {
    isOpen: true,
    membre: membreMock,
    isCurrentUser: true,
  },
};
