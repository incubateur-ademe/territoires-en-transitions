import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ComponentProps, useState } from 'react';
import { action } from 'storybook/actions';
import { expect, waitFor, within } from 'storybook/test';

import { Select, SelectMultiple } from '.';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Field } from '../Field';
import { Modal } from '../Modal';
import { SelectBase } from './components/SelectBase';
import { SelectFilter } from './SelectFilter';
import {
  Option,
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

const RenderDefault = (args: ComponentProps<typeof Select>) => {
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
};

export const Default: Story = {
  args: { options: singleOptions },
  render: (args) => <RenderDefault {...args} />,
};

const RenderSmallWithBadgeItems = (args: ComponentProps<typeof Select>) => {
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
};

export const SmallWithBadgeItems: Story = {
  args: { options: singleOptions, small: true },
  render: (args) => <RenderSmallWithBadgeItems {...args} />,
};

export const Disabled: Story = {
  args: { options: singleOptions, onChange: () => null, disabled: true },
};

const RenderMultiSelectWithSections = (args: ComponentProps<typeof Select>) => {
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
};

export const MultiSelectWithSectionOptions: Story = {
  args: { options: optionsWithSections, multiple: true },
  render: (args) => <RenderMultiSelectWithSections {...args} />,
};

const RenderDisabledOption = (args: ComponentProps<typeof Select>) => {
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
    />
  );
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
  render: (args) => <RenderDisabledOption {...args} />,
};

const RenderSearchableMultiSelect = (args: ComponentProps<typeof Select>) => {
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
};

export const SearchableMultiSelect: Story = {
  args: {
    options: optionsWithSections,
    multiple: true,
    isSearcheable: true,
  },
  render: (args) => <RenderSearchableMultiSelect {...args} />,
};

const RenderDisabledSearchableMultiSelect = (
  args: ComponentProps<typeof Select>
) => {
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
};

export const DisabledSearchableMultiSelectWithValue: Story = {
  args: {
    options: singleOptions,
    disabled: true,
    isSearcheable: true,
    multiple: true,
  },
  render: (args) => <RenderDisabledSearchableMultiSelect {...args} />,
};

const RenderSearchableWithDebounce = (args: ComponentProps<typeof Select>) => {
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
};

export const SearchableSelectWithDebouncedApiCallOnTyping: Story = {
  args: {
    debounce: 500,
    options: singleOptions,
  },
  render: (args) => <RenderSearchableWithDebounce {...args} />,
};

const RenderCreateOption = (args: ComponentProps<typeof Select>) => {
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
          if (values) {
            setValues([...values, newOption.value]);
          } else {
            setValues([newOption.value]);
          }
        },
        onUpdate: (value, label) =>
          setOptions(
            getFlatOptions(options).map((o) =>
              o.value !== value ? o : { label, value }
            )
          ),
        onDelete: (value) => {
          setOptions(getFlatOptions(options).filter((o) => o.value !== value));
          setValues(
            values && values.length > 1
              ? values.filter((v) => v !== value)
              : undefined
          );
        },
      }}
    />
  );
};

export const CreateOption: Story = {
  args: {
    multiple: true,
  },
  render: (args) => <RenderCreateOption {...args} />,
};

const RenderFilter = (args: ComponentProps<typeof Select>) => {
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
        custom={{
          renderOptionItem: (option: Option) => (
            <div className="flex items-center px-2 py-1 text-sm text-white bg-warning-1 rounded-xl">
              {option.label}
            </div>
          ),
        }}
      />
      <SelectFilter
        {...args}
        values={values}
        onChange={({ values }) => {
          setValues(values);
          action('onChange');
        }}
      />
    </div>
  );
};

export const Filter: Story = {
  args: { options: optionsWithSections },
  render: (args) => <RenderFilter {...args} />,
};

const RenderWithField = (args: ComponentProps<typeof Select>) => {
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
};

export const WithField: Story = {
  args: { options: singleOptions },
  render: (args) => <RenderWithField {...args} />,
};

const RenderCreateOptionInModal = () => {
  const [values, setValues] = useState<OptionValue[] | undefined>();
  const [options, setOptions] = useState(singleOptions);
  const userCreatedOptions = getFlatOptions(options)
    .filter((o) => typeof o.value === 'number')
    .map((o) => o.value);

  return (
    <Modal
      title="Select avec création dans une modale"
      render={() => (
        <div className="flex flex-col gap-6">
          <Field title="Pilotes">
            <SelectMultiple
              options={options}
              values={values}
              onChange={({ values }) => setValues(values)}
              multiple
              createProps={{
                userCreatedOptions,
                onCreate: (label) => {
                  const newOption: SelectOption = {
                    label,
                    value: Date.now(),
                  };
                  setOptions([...options, newOption]);
                  setValues([...(values ?? []), newOption.value]);
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
          </Field>
        </div>
      )}
    >
      <Button variant="outlined">Ouvrir la modale</Button>
    </Modal>
  );
};

export const CreateOptionInModal: Story = {
  args: {},
  render: () => <RenderCreateOptionInModal />,
};

const RenderCustomItemInBadgesAndOptions = (
  args: ComponentProps<typeof Select>
) => {
  const [value, setValue] = useState<OptionValue | undefined>(
    isSingleOption(singleOptions[0]) ? singleOptions[0].value : undefined
  );
  return (
    <Select
      {...args}
      values={value}
      onChange={(v) => {
        setValue(v);
        action('onChange');
      }}
      custom={{
        renderOptionItem: (option: Option) => (
          <div className="text-blue-300">{option.label}</div>
        ),
      }}
    />
  );
};

export const CustomItemDisplayInBadgesAndInOptions: Story = {
  args: { options: singleOptions },
  render: (args) => <RenderCustomItemInBadgesAndOptions {...args} />,
};

const RenderCustomTriggerButton = (args: ComponentProps<typeof Select>) => {
  const [values, setValues] = useState<OptionValue[] | undefined>();
  return (
    <SelectMultiple
      {...args}
      values={values}
      onChange={({ values }) => {
        setValues(values);
        action('onChange');
      }}
      custom={{
        triggerButton: {
          button: (
            <Button
              variant="outlined"
              size="sm"
              notification={
                values?.length
                  ? { size: 'xs', number: values?.length }
                  : undefined
              }
            >
              Choisir des options
            </Button>
          ),
          containerMaxWidth: '20rem',
        },
      }}
    />
  );
};

export const CustomTriggerButton: Story = {
  args: { options: singleOptions },
  render: (args) => <RenderCustomTriggerButton {...args} />,
};

export const CustomTriggerButtonDisabledSelect: Story = {
  args: { options: singleOptions, disabled: true },
  render: (args) => <RenderCustomTriggerButton {...args} />,
};

const RenderSeparateValueAndOptionRendering = (
  args: ComponentProps<typeof Select>
) => {
  const [values, setValues] = useState<OptionValue[] | undefined>();
  return (
    <SelectMultiple
      {...args}
      values={values}
      onChange={({ values }) => {
        setValues(values);
      }}
      custom={{
        renderValueItem: (option: Option) => (
          <Badge
            title={option.label}
            variant="success"
            type="solid"
            size="sm"
          />
        ),
        renderOptionItem: (option: Option) => (
          <Badge title={option.label} variant="info" type="solid" size="sm" />
        ),
        valueMatchOption: false,
      }}
      enableDisplayLimitValue={false}
    />
  );
};

export const SeparateValueAndOptionRendering: Story = {
  args: { options: singleOptions },
  render: (args) => <RenderSeparateValueAndOptionRendering {...args} />,
};

const scrollableOptions: SelectOption[] = Array.from(
  { length: 12 },
  (_, index) => ({
    value: index + 1,
    label: `Option ${index + 1}`,
  })
);

export const ConstrainedDropdownHeight: Story = {
  args: {
    options: scrollableOptions,
    dataTest: 'ui.select.constrained-height',
    // Six complete options and half of the next one, plus the bottom border.
    containerMaxHeight: 'calc(6.5 * 2.5rem + 1px)',
  },
  render: (args) => <RenderDefault {...args} />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'ouvrir le menu' });
    await userEvent.click(trigger);
    const seventhOption = body.getByRole('button', { name: 'Option 7' });
    const viewport = canvasElement.ownerDocument.querySelector(
      '[data-test="ui.select.constrained-height-options"]'
    )?.parentElement;
    if (!viewport) throw new Error('Expected an open dropdown');

    await waitFor(() => {
      const menuBounds = viewport.getBoundingClientRect();
      const optionBounds = seventhOption.getBoundingClientRect();
      expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
      expect(menuBounds.bottom).toBeGreaterThan(optionBounds.top);
      expect(menuBounds.bottom).toBeLessThan(optionBounds.bottom);
    });

    const lastOption = body.getByRole('button', { name: 'Option 12' });
    lastOption.scrollIntoView({ block: 'nearest' });
    await expect(viewport.scrollTop).toBeGreaterThan(0);
    await userEvent.click(lastOption);
    await expect(trigger).toHaveTextContent('Option 12');
    await expect(body.queryByRole('button', { name: 'Option 12' })).toBeNull();
  },
};

const RenderPortalInScrollableModal = (args: ComponentProps<typeof Select>) => (
  <Modal
    title="Sélecteur dans une modale défilante"
    scrollableContent
    render={() => (
      <div
        role="group"
        aria-label="Contenu défilant"
        className="h-28 overflow-y-auto"
      >
        <RenderDefault {...args} />
        <div aria-hidden className="h-64" />
      </div>
    )}
  >
    <Button variant="outlined">Ouvrir la modale</Button>
  </Modal>
);

export const PortalInScrollableModal: Story = {
  args: {
    options: scrollableOptions,
    containerMaxHeight: 262,
    renderInPortal: true,
  },
  render: (args) => <RenderPortalInScrollableModal {...args} />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const document = canvasElement.ownerDocument;
    const body = within(document.body);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Ouvrir la modale' })
    );
    const dialog = body.getByRole('dialog');
    const trigger = within(dialog).getByRole('button', {
      name: 'ouvrir le menu',
    });
    await userEvent.click(trigger);
    const firstOption = body.getByRole('button', { name: 'Option 1' });
    await expect(dialog).not.toContainElement(firstOption);
    await waitFor(() => {
      const bounds = firstOption.getBoundingClientRect();
      expect(
        firstOption.contains(
          document.elementFromPoint(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2
          )
        )
      ).toBe(true);
    });

    const lastOption = body.getByRole('button', { name: 'Option 12' });
    lastOption.scrollIntoView({ block: 'nearest' });
    await userEvent.click(lastOption);
    await expect(trigger).toHaveTextContent('Option 12');
    await expect(dialog).toBeVisible();

    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    await expect(body.queryByRole('button', { name: 'Option 1' })).toBeNull();
    await expect(dialog).toBeVisible();
    // Leave the portal open so its position can also be inspected visually.
    await userEvent.click(trigger);
  },
};
