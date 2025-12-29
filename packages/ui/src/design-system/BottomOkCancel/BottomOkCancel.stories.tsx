import { action } from 'storybook/actions';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BottomOkCancel } from './BottomOkCancel';

const meta: Meta<typeof BottomOkCancel> = {
  component: BottomOkCancel,
};

export default meta;

type Story = StoryObj<typeof BottomOkCancel>;

export const Valider: Story = {
  args: {
    title: 'Confirmer la suppression ?',
    btnOKProps: {
      onClick: action('onOK'),
    },
  },
};

export const AnnulerValider: Story = {
  args: {
    title: 'Confirmer la suppression ?',
    btnOKProps: {
      onClick: action('onOK'),
    },
    btnCancelProps: {
      onClick: action('onCancel'),
    },
  },
};

export const CustomLabels: Story = {
  args: {
    title: 'Confirmer la suppression ?',
    btnOKProps: {
      children: 'OK',
      onClick: action('onOK'),
    },
    btnCancelProps: {
      children: 'Dismiss',
      onClick: action('onCancel'),
    },
  },
};
