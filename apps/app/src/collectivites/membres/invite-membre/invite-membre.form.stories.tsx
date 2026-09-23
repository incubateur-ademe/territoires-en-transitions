import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { InviteMembreForm } from './invite-membre.form';

const meta: Meta<typeof InviteMembreForm> = {
  component: InviteMembreForm,
  args: {
    onCancel: action('onCancel'),
    onSubmit: action('onSubmit'),
  },
};

export default meta;

type Story = StoryObj<typeof InviteMembreForm>;

export const Default: Story = {};
