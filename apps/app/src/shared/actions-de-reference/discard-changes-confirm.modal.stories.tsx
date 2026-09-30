import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DiscardChangesConfirmModal } from './discard-changes-confirm.modal';

const meta: Meta<typeof DiscardChangesConfirmModal> = {
  component: DiscardChangesConfirmModal,
  args: {
    onDiscard: () => undefined,
    onKeepEditing: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof DiscardChangesConfirmModal>;

export const Ouverte: Story = {
  args: { isOpen: true },
};
