import {PasswordRecovery, TPasswordRecoveryOpts} from './PasswordRecovery';
// eslint-disable-next-line node/no-unpublished-import
import {action} from '@storybook/addon-actions';
import {observable} from 'mobx';

export default {
  component: PasswordRecovery,
  args: {
    bloc: observable({
      resetPasswordForEmail: action('resetPasswordForEmail'),
    }),
  },
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

export const Error = (args: TPasswordRecoveryOpts) => (
  <PasswordRecovery
    {...args}
    opened
    email="someone@example.com"
    bloc={observable({
      resetPasswordForEmail: action('resetPasswordForEmail'),
      authError: 'Adresse non valide',
    })}
  />
);
Error.parameters = {storyshots: false};
