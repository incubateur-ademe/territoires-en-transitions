import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {InputSearch} from './InputSearch';
import {useState} from 'react';

const meta: Meta<typeof InputSearch> = {
  title: 'Design System/InputSearch',
  component: InputSearch,
  render: args => {
    const [value, setValue] = useState(args.value || '');
    return (
      <InputSearch
        {...args}
        value={value}
        onChange={e => setValue(e.target.value)}
        onSearch={action('onSearch')}
      />
    );
  },
};

export default meta;

type Story = StoryObj<typeof InputSearch>;

/** Sans aucune props renseignée. */
export const Default: Story = {
  args: {},
};

/** Avec une valeur renseignée. */
export const AvecValeur: Story = {
  args: {
    value: 'valeur recherchée',
  },
};
