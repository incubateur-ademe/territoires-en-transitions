import {useState} from 'react';
import {Meta, StoryObj} from '@storybook/nextjs';
import {Checkbox} from './Checkbox';

const meta: Meta<typeof Checkbox> = {
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
  args: {
    id: 'cb1',
  },
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
  args: {
    id: 'cb2',
  },
};

export const Checked: Story = {
  args: {
    id: 'cb3',
    checked: true,
  },
};

export const UncheckedAndDisabled: Story = {
  args: {
    id: 'cb4',
    checked: false,
    disabled: true,
  },
};

export const CheckedAndDisabled: Story = {
  args: {
    id: 'cb5',
    checked: true,
    disabled: true,
  },
};

export const LongLabelAvecMessage: Story = {
  args: {
    id: 'cb6',
    label: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    message:
      'Le lorem ipsum est, en imprimerie, une suite de mots sans signification utilisée',
  },
  render: args => (
    <div className="max-w-[16rem]">
      <Checkbox {...args} />
    </div>
  ),
};

export const AvecMessage: Story = {
  args: {
    id: 'cb7',
    message: 'Description additionnelle',
  },
};

export const AvecMessageEtEtat: Story = {
  args: {
    id: 'cb8',
    message: 'Description additionnelle',
    state: 'info',
  },
};

export const AvecMessageUniquement: Story = {
  args: {
    id: 'cb9',
    message:
      'Le lorem ipsum est, en imprimerie, une suite de mots sans signification utilisée',
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render: ({label, ...args}) => <Checkbox {...args} />,
};

export const VarianteSwitch: Story = {
  args: {
    id: 'cb10',
    message: 'Description additionnelle',
    state: 'info',
    variant: 'switch',
  },
};

export const VarianteSwitchChecked: Story = {
  args: {
    id: 'cb11',
    checked: true,
    message:
      'Le lorem ipsum est, en imprimerie, une suite de mots sans signification utilisée',
    state: 'info',
    variant: 'switch',
  },
};

export const VarianteSwitchDisabled: Story = {
  args: {
    id: 'cb12',
    disabled: true,
    checked: true,
    variant: 'switch',
  },
};

export const AvecPersonnalisationDuContainer: Story = {
  args: {
    id: 'cb13',
    checked: true,
    containerClassname: 'border border-grey p-4',
  },
};
