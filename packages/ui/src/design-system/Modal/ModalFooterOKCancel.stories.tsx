import { action } from 'storybook/actions';
import { Meta, StoryObj } from '@storybook/nextjs';
import { ModalFooterOKCancel } from './ModalFooterOKCancel';

const meta: Meta<typeof ModalFooterOKCancel> = {
  component: ModalFooterOKCancel,
};

export default meta;

type Story = StoryObj<typeof ModalFooterOKCancel>;

export const Valider: Story = {
  args: {
    btnOKProps: {
      onClick: action('onOK'),
    },
  },
};

export const AnnulerValider: Story = {
  args: {
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
