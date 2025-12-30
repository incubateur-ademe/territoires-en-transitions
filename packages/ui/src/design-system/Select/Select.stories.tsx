import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { action } from 'storybook/actions';

import { Select, SelectMultiple } from '.';
import { Field } from '../Field';
import { SelectBase } from './components/SelectBase';
import { SelectFilter } from './SelectFilter';
import {
  OptionValue,
  SelectOption,
  getFlatOptions,
  isSingleOption,
} from './utils';

const singleOptions: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  {
    value: 'option3',
    label:
      "Un titre d'option super long, car nous avons besoin de voir le comportement",
  },
];

const optionsWithSections: SelectOption[] = [
  { value: 'ss1', label: 'Option sans section 1' },
  { value: 'ss2', label: 'Option sans section 2' },
  {
    title: 'Section 1',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
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
      { value: 'option4', label: 'Option 4' },
      { value: 'option5', label: 'Option 5' },
    ],
  },
];

const meta: Meta<typeof Select> = {
  component: SelectBase,
  decorators: [
    (story) => <div className="w-full max-w-[24rem]">{story()}</div>,
  ],
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: { options: singleOptions },
  render: (args) => {
    const [value, setValue] = useState<OptionValue | undefined>();
    return (
      <Select
        {...args}
        values={value}
        onChange={(v) => {
          setValue(v);
          action('onChange');
        }}
      />
    );
  },
};

export const SmallWithBadgeItems: Story = {
  args: { options: singleOptions, small: true, isBadgeItem: true },
  render: (args) => {
    const [value, setValue] = useState<OptionValue | undefined>();
    return (
      <Select
        {...args}
        values={value}
        onChange={(v) => {
          setValue(v);
          action('onChange');
        }}
      />
    );
  },
};

export const Disabled: Story = {
  args: { options: singleOptions, onChange: () => null, disabled: true },
};

export const CustomItemDisplay: Story = {
  args: { options: singleOptions },
  render: (args) => {
    const [value, setValue] = useState<OptionValue | undefined>();
    return (
      <Select
        {...args}
        values={value}
        onChange={(v) => {
          setValue(v);
          action('onChange');
        }}
        customItem={(option) => (
          <div className="flex items-center px-2 py-1 text-sm text-white bg-warning-1 rounded-xl">
            {option.label}
          </div>
        )}
      />
    );
  },
};

export const MultiSelectWithSectionOptions: Story = {
  args: { options: optionsWithSections, multiple: true },
  render: (args) => {
    const [values, setValues] = useState<OptionValue[] | undefined>();
    return (
      <SelectMultiple
        {...args}
        values={values}
        onChange={({ values }) => {
          setValues(values);
        }}
      />
    );
  },
};

export const DisabledOption: Story = {
  args: {
    options: [
      {
        value: 'disabledOption',
        label: 'Option désactivée',
        disabled: true,
      },
      ...optionsWithSections,
    ],
    multiple: true,
  },
  render: (args) => {
    const [values, setValues] = useState<OptionValue[] | undefined>([
      'disabledOption',
    ]);
    return (
      <SelectMultiple
        {...args}
        values={values}
        onChange={({ values }) => {
          setValues(values);
        }}
        isBadgeItem
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
  render: (args) => {
    const [values, setValues] = useState<OptionValue[] | undefined>();
    return (
      <SelectMultiple
        {...args}
        values={values}
        onChange={({ values }) => {
          setValues(values);
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
  render: (args) => {
    const [values, setValues] = useState<OptionValue[] | undefined>([
      'option1',
      'option2',
    ]);
    return (
      <SelectMultiple
        {...args}
        values={values}
        onChange={({ values }) => {
          setValues(values);
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
  render: (args) => {
    const [value, setValue] = useState<OptionValue | undefined>();
    return (
      <Select
        {...args}
        values={value}
        onChange={(v) => {
          setValue(v);
        }}
        onSearch={(v) => console.log(v)}
      />
    );
  },
};

export const CreateOption: Story = {
  args: {
    multiple: true,
  },
  render: (args) => {
    const [values, setValues] = useState<OptionValue[] | undefined>();
    const [options, setOptions] = useState(singleOptions);
    const userCreatedOptions = getFlatOptions(options)
      .filter((o) => typeof o.value === 'number')
      .map((o) => o.value);

    return (
      <SelectMultiple
        {...args}
        options={options}
        values={values}
        onChange={({ values }) => {
          setValues(values);
        }}
        createProps={{
          userCreatedOptions,
          onCreate: (label) => {
            const newOption: SelectOption = {
              label,
              value: Date.now(),
            };
            setOptions([...options, newOption]);
            values
              ? setValues([...values, newOption.value])
              : setValues([newOption.value]);
          },
          onUpdate: (value, label) =>
            setOptions(
              getFlatOptions(options).map((o) =>
                o.value !== value ? o : { label, value }
              )
            ),
          onDelete: (value) => {
            setOptions(
              getFlatOptions(options).filter((o) => o.value !== value)
            );
            setValues(
              values && values.length > 1
                ? values.filter((v) => v !== value)
                : undefined
            );
          },
        }}
      />
    );
  },
};

export const Filter: Story = {
  args: { options: optionsWithSections },
  render: (args) => {
    const [values, setValues] = useState<OptionValue[] | undefined>();
    return (
      <div className="flex flex-col gap-6">
        <SelectFilter
          {...args}
          values={values}
          onChange={({ values }) => {
            setValues(values);
            action('onChange');
          }}
        />
        <SelectFilter
          {...args}
          values={values}
          onChange={({ values }) => {
            setValues(values);
            action('onChange');
          }}
          customItem={(option) => (
            <div className="flex items-center px-2 py-1 text-sm text-white bg-warning-1 rounded-xl">
              {option.label}
            </div>
          )}
        />
        <SelectFilter
          {...args}
          values={values}
          onChange={({ values }) => {
            setValues(values);
            action('onChange');
          }}
          isBadgeItem
        />
      </div>
    );
  },
};

export const WithField: Story = {
  args: { options: singleOptions },
  render: (args) => {
    const [value, setValue] = useState<OptionValue | undefined>();
    return (
      <Field
        title="Description de l'action"
        hint="Texte description additionnel"
        state="info"
        message="Message d'information"
      >
        <Select
          {...args}
          values={value}
          onChange={(v) => {
            setValue(v);
            action('onChange');
          }}
        />
      </Field>
    );
  },
};

export const ZIndex: Story = {
  args: {},
  render: () => {
    const [value, setValue] = useState<OptionValue | undefined>();
    return (
      <div className="h-screen">
        <div className="relative h-full m-16">
          <div id="yolo" className="absolute inset-0 z-20 bg-pink-100">
            <Field title="Exemple">
              <Select
                parentId="yolo"
                options={optionsWithSections}
                values={value}
                onChange={(v) => {
                  setValue(v);
                  action('onChange');
                }}
              />
            </Field>
            <Field
              title="Devrait être sous les options du select"
              className="relative mt-6"
            >
              <div className="p-4 bg-blue-300 rounded-lg">test</div>
            </Field>
          </div>
        </div>
      </div>
    );
  },
};

export const MultiSelectWithMaxBadges: Story = {
  args: {
    options: optionsWithSections,
    multiple: true,
    maxBadgesToShow: 2,
  },
  render: (args) => {
    const [values, setValues] = useState<OptionValue[] | undefined>();
    return (
      <SelectMultiple
        {...args}
        values={values}
        onChange={({ values }) => {
          setValues(values);
        }}
      />
    );
  },
};

export const CustomItemDisplayInBadgesAndInOptions: Story = {
  args: { options: singleOptions },
  render: (args) => {
    const [value, setValue] = useState<OptionValue | undefined>(
      isSingleOption(singleOptions[0]) ? singleOptions[0].value : undefined
    );
    return (
      <div className="flex flex-col gap-6">
        <Select
          {...args}
          values={value}
          onChange={(v) => {
            setValue(v);
            action('onChange');
          }}
          customItem={(option) => (
            <div className="text-blue-300">{option.label}</div>
          )}
          showCustomItemInBadges={true}
        />
        <Select
          {...args}
          values={value}
          onChange={(v) => {
            setValue(v);
            action('onChange');
          }}
          customItem={(option) => (
            <div className="text-blue-300">{option.label}</div>
          )}
          showCustomItemInBadges={false}
        />
      </div>
    );
  },
};
