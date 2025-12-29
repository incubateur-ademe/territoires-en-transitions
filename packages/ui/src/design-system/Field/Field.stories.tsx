import { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Input } from '../Input';
import { Field } from './Field';

const meta: Meta<typeof Field> = {
  component: Field,
  decorators: [(story) => <div className="flex">{story()}</div>],
  render: (args) => (
    <Field {...args} htmlFor="un_nom">
      <Input
        type="text"
        id="un_nom"
        placeholder="Placeholder"
        state={args.state}
        disabled={args.state === 'disabled'}
      />
    </Field>
  ),
};

export default meta;

type Story = StoryObj<typeof Field>;

export const Default: Story = {
  args: { title: "Description de l'action" },
};

export const DisabledWithHint: Story = {
  args: {
    title: "Description de l'action",
    state: 'disabled',
    hint: 'Texte description additionnel',
    message: 'Message d’information',
  },
};

export const WithHint: Story = {
  args: {
    title: "Description de l'action",
    hint: 'Texte description additionnel',
    message: 'Message d’information',
  },
};

export const WithInfo: Story = {
  args: {
    title: "Description de l'action",
    state: 'info',
    message: 'Message d’information',
  },
};

export const WithError: Story = {
  args: {
    title: "Description de l'action",
    state: 'error',
    message: "Message d'erreur",
  },
};

export const WithSuccess: Story = {
  args: {
    title: "Description de l'action",
    state: 'success',
    message: 'Message de succès',
  },
};

export const WithWarning: Story = {
  args: {
    title: "Description de l'action",
    state: 'warning',
    message: "Message d'avertissement",
  },
};
