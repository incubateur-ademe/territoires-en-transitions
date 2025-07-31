import {Meta, StoryObj} from '@storybook/nextjs';
import {action} from 'storybook/actions';
import {VerifyOTP} from './VerifyOTP';

const meta: Meta<typeof VerifyOTP> = {
  component: VerifyOTP,
  args: {
    onCancel: action('onCancel'),
    onSubmit: action('onSubmit'),
    onResend: action('onResend'),
    defaultValues: {email: 'yolo@dodo.com', otp: ''},
  },
};

export default meta;

type Story = StoryObj<typeof VerifyOTP>;

export const TypeLogin: Story = {
  args: {type: 'login'},
};

export const TypeSignup: Story = {
  args: {type: 'signup'},
};

export const TypeResetPassword: Story = {
  args: {type: 'reset_password'},
};

export const PreRempli: Story = {
  args: {
    type: 'reset_password',
    defaultValues: {email: 'yolo@dodo.com', otp: '123456'},
  },
};

export const IsLoading: Story = {
  args: {
    type: 'reset_password',
    isLoading: true,
    defaultValues: {email: 'yolo@dodo.com', otp: '123456'},
  },
};

export const AvecErreur: Story = {
  args: {
    type: 'reset_password',
    defaultValues: {email: 'yolo@dodo.com', otp: '123456'},
    error: "Message d'erreur",
  },
};
