import {Meta, StoryObj} from '@storybook/react';

import {Field} from '.';

const meta: Meta<typeof Field> = {
  component: Field,
  decorators: [story => <div className="flex">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof Field>;

const FakeInput = () => (
  <input
    type="text"
    className="border border-solid border-grey-4 rounded-lg min-h-[3rem] px-4 placeholder:text-sm"
    placeholder="Placeholder"
  />
);

export const Default: Story = {
  args: {title: "Description de l'action"},
  render: args => (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <Field {...args}>
        <FakeInput />
      </Field>
      <Field {...args} title="Small" small>
        <FakeInput />
      </Field>
    </div>
  ),
};

export const DisabledWithHint: Story = {
  args: {
    title: "Description de l'action",
    state: 'disabled',
    hint: 'Texte description additionnel',
    message: 'Message d’information',
  },
  render: args => (
    <Field {...args}>
      <FakeInput />
    </Field>
  ),
};

export const WithHint: Story = {
  args: {
    title: "Description de l'action",
    hint: 'Texte description additionnel',
    message: 'Message d’information',
  },
  render: args => (
    <Field {...args}>
      <FakeInput />
    </Field>
  ),
};

export const WithInfo: Story = {
  args: {
    title: "Description de l'action",
    state: 'info',
    message: 'Message d’information',
  },
  render: args => (
    <Field {...args}>
      <FakeInput />
    </Field>
  ),
};

export const WithError: Story = {
  args: {
    title: "Description de l'action",
    state: 'error',
    message: "Message d'erreur",
  },
  render: args => (
    <Field {...args}>
      <FakeInput />
    </Field>
  ),
};

export const WithSuccess: Story = {
  args: {
    title: "Description de l'action",
    state: 'success',
    message: 'Message de succès',
  },
  render: args => (
    <Field {...args}>
      <FakeInput />
    </Field>
  ),
};

export const WithWarning: Story = {
  args: {
    title: "Description de l'action",
    state: 'warning',
    message: "Message d'avertissement",
  },
  render: args => (
    <Field {...args}>
      <FakeInput />
    </Field>
  ),
};
