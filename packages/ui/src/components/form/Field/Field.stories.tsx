import Field from './Field';
import {Meta, StoryObj} from '@storybook/react';

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
    <Field {...args}>
      <FakeInput />
    </Field>
  ),
};

export const Disabled: Story = {
  args: {title: "Description de l'action", state: 'disabled'},
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
