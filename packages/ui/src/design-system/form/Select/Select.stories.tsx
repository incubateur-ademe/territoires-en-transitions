import {useState} from 'react';
import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';

import {Field} from '@design-system/Field';

import {Select} from './Select';
import {OptionValue, SelectOption} from './Options';
import {getFlatOptions, onSelectMultiple, onSelectSingle} from './utils';

const singleOptions: SelectOption[] = [
  {value: 'option1', label: 'Option 1'},
  {value: 'option2', label: 'Option 2'},
  {
    value: 'option3',
    label:
      "Un titre d'option super long, car nous avons besoin de voir le comportement",
  },
];

const optionsWithSections: SelectOption[] = [
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
  args: {options: singleOptions},
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

export const SmallWithBadgeItems: Story = {
  args: {options: singleOptions, small: true, isBadgeItem: true},
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
  args: {options: singleOptions, onChange: () => null, disabled: true},
};

export const CustomItem: Story = {
  args: {options: singleOptions},
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
        customItem={option => (
          <div className="flex items-center px-2 py-1 text-sm text-white bg-warning-1 rounded-xl">
            {option.label}
          </div>
        )}
      />
    );
  },
};

export const MultiSelectWithSectionOptions: Story = {
  args: {options: optionsWithSections, multiple: true},
  render: args => {
    const [values, setValues] = useState<OptionValue[] | undefined>();
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

export const SearchableMultiSelect: Story = {
  args: {
    options: optionsWithSections,
    multiple: true,
    isSearcheable: true,
    emptySearchPlaceholder:
      "Placeholder custom pour la liste d'option sans résultat",
  },
  render: args => {
    const [values, setValues] = useState<OptionValue[] | undefined>();
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

export const DisabledSearchableMultiSelectWithValue: Story = {
  args: {
    options: singleOptions,
    disabled: true,
    isSearcheable: true,
    multiple: true,
  },
  render: args => {
    const [values, setValues] = useState<OptionValue[] | undefined>([
      'option1',
      'option2',
    ]);
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

export const SearchableSelectWithDebouncedApiCallOnTyping: Story = {
  args: {
    debounce: 500,
    options: singleOptions,
  },
  render: args => {
    const [value, setValue] = useState<OptionValue | undefined>();
    return (
      <Select
        {...args}
        values={value}
        onChange={v => {
          setValue(onSelectSingle(v, value));
        }}
        onSearch={v => console.log(v)}
      />
    );
  },
};

export const CreateOption: Story = {
  args: {
    multiple: true,
  },
  render: args => {
    const [values, setValues] = useState<OptionValue[] | undefined>();
    const [options, setOptions] = useState(singleOptions);
    const userCreatedOptions = getFlatOptions(options)
      .filter(o => typeof o.value === 'number')
      .map(o => o.value);

    return (
      <Select
        {...args}
        options={options}
        values={values}
        onChange={v => {
          setValues(onSelectMultiple(v, values));
        }}
        createProps={{
          userCreatedOptions,
          onCreate: label => {
            const newOption: SelectOption = {
              label,
              value: Date.now(),
            };
            setOptions([...options, newOption]);
            setValues(onSelectMultiple(newOption.value, values));
          },
          onUpdate: (value, label) =>
            setOptions(
              getFlatOptions(options).map(o =>
                o.value !== value ? o : {label, value}
              )
            ),
          onDelete: value => {
            setOptions(getFlatOptions(options).filter(o => o.value !== value));
            setValues(onSelectMultiple(value, values));
          },
        }}
      />
    );
  },
};

export const WithField: Story = {
  args: {options: singleOptions},
  render: args => {
    const [value, setValue] = useState<OptionValue | undefined>();
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
