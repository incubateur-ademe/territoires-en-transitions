import React, {useState} from 'react';

import Select from './Select';
import {Meta, StoryObj} from '@storybook/react';

const options = [
  {value: 'option1', label: 'Option 1'},
  {value: 'option2', label: 'Option 2'},
  {
    value: 'option3',
    label:
      "Un titre d'option super long, car nous avons besoin de voir le comportement",
  },
];

const optionsWithSections = [
  {value: 'ss1', label: 'Option sans section 1'},
  {value: 'ss2', label: 'Option sans section 2'},
  {
    title: 'Section 1',
    options: [
      {value: 'option1', label: 'Option 1'},
      {value: 'option2', label: 'Option 2'},
      {
        value: 'option3',
        label:
          "Un titre d'option super long, car nous avons besoin de voir le comportement",
      },
    ],
  },
  {
    title: 'Section 2',
    options: [
      {value: 'option4', label: 'Option 4'},
      {value: 'option5', label: 'Option 5'},
    ],
  },
];

const meta: Meta<typeof Select> = {
  component: Select,
  decorators: [story => <div className="w-full max-w-[24rem]">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {options},
  render: args => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <Select
        {...args}
        values={value}
        onSelect={v => {
          setValue(v[0]);
        }}
      />
    );
  },
};

export const Disabled: Story = {
  args: {options, onSelect: () => null, disabled: true},
};

export const MultiSelectWithSectionOptions: Story = {
  args: {options: optionsWithSections, isMulti: true},
  render: args => {
    const [values, setValues] = useState<string[] | undefined>(undefined);
    return (
      <Select
        {...args}
        values={values}
        onSelect={v => {
          setValues(v);
        }}
      />
    );
  },
};

export const InputSelect: Story = {
  args: {options: optionsWithSections, isMulti: true},
  render: () => <div>TODO</div>,
};

// ne pas oublier le menu sur chaque option
export const CreateOptionSelect: Story = {
  args: {options: optionsWithSections, isMulti: true},
  render: () => <div>TODO</div>,
};
