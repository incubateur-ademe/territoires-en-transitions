import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { InviteMemberForm } from './invite-member.form';

const meta: Meta<typeof InviteMemberForm> = {
  component: InviteMemberForm,
  args: {
    onCancel: action('onCancel'),
    onSubmit: action('onSubmit'),
  },
};

export default meta;

type Story = StoryObj<typeof InviteMemberForm>;

export const ModeEdition: Story = {
  args: { niveauAcces: 'edition' },
};

export const ModeAdmin: Story = {
  args: { niveauAcces: 'admin' },
};
