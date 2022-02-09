import {PasswordRecovery, TPasswordRecoveryOpts} from './PasswordRecovery';

export default {
  component: PasswordRecovery,
};

export const Default = (args: TPasswordRecoveryOpts) => (
  <PasswordRecovery {...args} />
);

export const Opened = (args: TPasswordRecoveryOpts) => (
  <PasswordRecovery {...args} opened />
);
Opened.parameters = {storyshots: false};

export const Prefilled = (args: TPasswordRecoveryOpts) => (
  <PasswordRecovery {...args} opened email="someone@example.com" />
);
Prefilled.parameters = {storyshots: false};

export const Succeed = (args: TPasswordRecoveryOpts) => (
  <PasswordRecovery
    {...args}
    opened
    email="someone@example.com"
    succeed="someone@example.com"
  />
);
Succeed.parameters = {storyshots: false};
