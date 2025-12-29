import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import {
  fakeAdmin,
  fakeEditeur,
  fakeLecteur,
} from '../../_components/fakeData';
import MembreListTable from './MembreListTable';

const meta: Meta<typeof MembreListTable> = {
  component: MembreListTable,
};

export default meta;

type Story = StoryObj<typeof MembreListTable>;

const handlers = {
  sendInvitation: action('sendInvitation'),
};

export const AsAdmin: Story = {
  args: {
    collectiviteId: 1,
    currentUserId: fakeAdmin.user_id as string,
    currentUserAccess: 'admin',
    ...handlers,
  },
};

export const AsEditeur: Story = {
  args: {
    collectiviteId: 1,
    currentUserId: fakeEditeur.user_id as string,
    currentUserAccess: 'edition',
    ...handlers,
  },
};

export const AsLecteur: Story = {
  args: {
    collectiviteId: 1,
    currentUserId: fakeLecteur.user_id as string,
    currentUserAccess: 'lecture',
    ...handlers,
  },
};
