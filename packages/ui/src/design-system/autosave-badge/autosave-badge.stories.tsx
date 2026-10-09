import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AutosaveBadge } from './autosave-badge';

const meta: Meta<typeof AutosaveBadge> = {
  component: AutosaveBadge,
  title: 'Design System/Autosave badge',
};

export default meta;

type Story = StoryObj<typeof AutosaveBadge>;

export const Saving: Story = { args: { status: 'saving' } };

export const Saved: Story = { args: { status: 'saved' } };

export const Failed: Story = { args: { status: 'error' } };

export const Idle: Story = { args: { status: 'idle' } };
