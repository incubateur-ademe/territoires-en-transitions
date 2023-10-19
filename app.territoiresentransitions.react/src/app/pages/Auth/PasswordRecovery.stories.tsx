import {PasswordRecovery, TPasswordRecoveryOpts} from './PasswordRecovery';

export default {
  component: PasswordRecovery,
};

export const Default = {};

export const Opened = {
  render: (args: TPasswordRecoveryOpts) => (
    <PasswordRecovery {...args} opened />
  ),

  parameters: {storyshots: false},
};

export const Prefilled = {
  render: (args: TPasswordRecoveryOpts) => (
    <PasswordRecovery {...args} opened email="someone@example.com" />
  ),

  parameters: {storyshots: false},
};

export const Succeed = {
  render: (args: TPasswordRecoveryOpts) => (
    <PasswordRecovery
      {...args}
      opened
      email="someone@example.com"
      succeed="someone@example.com"
    />
  ),

  parameters: {storyshots: false},
};
