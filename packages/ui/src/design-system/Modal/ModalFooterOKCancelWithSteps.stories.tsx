import { action } from 'storybook/actions';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ModalFooterOKCancelWithSteps } from './ModalFooterOKCancelWithSteps';

const meta: Meta<typeof ModalFooterOKCancelWithSteps> = {
  component: ModalFooterOKCancelWithSteps,
};

export default meta;

type Story = StoryObj<typeof ModalFooterOKCancelWithSteps>;

export const FirstStepForTwo: Story = {
  args: {
    currentStep: 1,
    stepsCount: 2,
    onStepChange: (step: number) => action('onStepChange')(step),
    btnOKProps: {
      onClick: action('onOK'),
    },
    btnCancelProps: {
      onClick: action('onCancel'),
    },
  },
};

export const SecondStepForTwo: Story = {
  args: {
    currentStep: 2,
    stepsCount: 2,
    onStepChange: (step: number) => action('onStepChange')(step),
    btnOKProps: {
      onClick: action('onOK'),
    },
    btnCancelProps: {
      onClick: action('onCancel'),
    },
  },
};

export const SecondStepForTree: Story = {
  args: {
    currentStep: 2,
    stepsCount: 3,
    onStepChange: (step: number) => action('onStepChange')(step),
    btnOKProps: {
      onClick: action('onOK'),
    },
    btnCancelProps: {
      onClick: action('onCancel'),
    },
  },
};
