import {useState} from 'react';
import {Meta, StoryObj} from '@storybook/react';
import {Checkbox} from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Design System/Checkbox',
  component: Checkbox,
  render: args => {
    const [checked, setChecked] = useState(args.checked || false);
    return (
      <Checkbox
        {...args}
        checked={checked}
        label="Description de l'action"
        onChange={() => setChecked(!checked)}
      />
    );
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const SansLabel: Story = {
  args: {},
  render: args => {
    const [checked, setChecked] = useState(args.checked || false);
    return (
      <Checkbox
        {...args}
        checked={checked}
        onChange={() => setChecked(!checked)}
      />
    );
  },
};

export const Unchecked: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const UncheckedAndDisabled: Story = {
  args: {
    checked: false,
    disabled: true,
  },
};

export const CheckedAndDisabled: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};

export const AvecMessage: Story = {
  args: {
    message: 'Description additionnelle',
  },
};

export const AvecMessageEtEtat: Story = {
  args: {
    message: 'Description additionnelle',
    state: 'info',
  },
};

export const VarianteSwitch: Story = {
  args: {
    message: 'Description additionnelle',
    state: 'info',
    variant: 'switch',
  },
};

export const VarianteSwitchChecked: Story = {
  args: {
    checked: true,
    message:
      'Le lorem ipsum est, en imprimerie, une suite de mots sans signification utilisée',
    state: 'info',
    variant: 'switch',
  },
};
