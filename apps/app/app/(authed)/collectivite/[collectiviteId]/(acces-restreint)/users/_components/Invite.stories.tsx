import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CollectiviteRole } from '@tet/domain/users';
import { action } from 'storybook/actions';
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
  args: { role: CollectiviteRole.EDITION },
};

export const ModeAdmin: Story = {
  args: { role: CollectiviteRole.ADMIN },
};
