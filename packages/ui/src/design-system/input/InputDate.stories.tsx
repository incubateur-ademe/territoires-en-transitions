import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {InputDate} from './InputDate';

const meta: Meta<typeof InputDate> = {
  title: 'Design System/InputDate',
  component: InputDate,
};

export default meta;

type Story = StoryObj<typeof InputDate>;

/** Sans aucune props renseignée. */
export const Default: Story = {
  args: {},
};

/** Avec une valeur renseignée. */
export const AvecValeur: Story = {
  args: {
    value: '2024-01-17',
    onChange: action('onChange'),
  },
};
