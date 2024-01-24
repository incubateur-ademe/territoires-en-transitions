import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {InputPassword} from './InputPassword';

const meta: Meta<typeof InputPassword> = {
  title: 'Design System/InputPassword',
  component: InputPassword,
};

export default meta;

type Story = StoryObj<typeof InputPassword>;

/** Sans aucune props renseignée. */
export const Default: Story = {
  args: {},
};

/** Avec une valeur renseignée. */
export const AvecValeur: Story = {
  args: {
    value: 'hyper secret',
    onChange: action('onChange'),
  },
};
