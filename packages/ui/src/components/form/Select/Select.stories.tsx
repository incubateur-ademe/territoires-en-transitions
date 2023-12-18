import React, {useState} from 'react';
import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';

import {Select} from './Select';
import Field from '../Field/Field';
import {OptionValue} from './Options';
import {onSelectMultiple, onSelectSingle} from './utils';

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
    const [value, setValue] = useState<OptionValue | undefined>();
    return (
      <Select
        {...args}
        values={value}
        onChange={v => {
          setValue(onSelectSingle(v, value));
          action('onChange');
        }}
      />
    );
  },
};

export const Disabled: Story = {
  args: {options, onChange: () => null, disabled: true},
};

export const MultiSelectWithSectionOptions: Story = {
  args: {options: optionsWithSections, multiple: true},
  render: args => {
    const [values, setValues] = useState<OptionValue[] | undefined>(undefined);
    return (
      <Select
        {...args}
        values={values}
        onChange={v => {
          setValues(onSelectMultiple(v, values));
        }}
      />
    );
  },
};

export const InputSelect: Story = {
  args: {options: optionsWithSections, multiple: true},
  render: () => <div>TODO</div>,
};

// ne pas oublier le menu sur chaque option
export const CreateOptionChange: Story = {
  args: {options: optionsWithSections, multiple: true},
  render: () => <div>TODO</div>,
};

export const WithField: Story = {
  args: {options},
  render: args => {
    const [value, setValue] = useState<OptionValue | undefined>(undefined);
    return (
      <Field
        title="Description de l'action"
        hint="Texte description additionnel"
        state="info"
        message="Message d’information"
      >
        <Select
          {...args}
          values={value}
          onChange={v => {
            setValue(onSelectSingle(v, value));
            action('onChange');
          }}
        />
      </Field>
    );
  },
};
