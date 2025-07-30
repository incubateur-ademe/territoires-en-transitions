import { Meta, StoryObj } from '@storybook/nextjs';
import { action } from 'storybook/actions';
import { Textarea } from './Textarea';
import { useRef, useState } from 'react';
import { AutoResizedTextarea } from './AutoResizedTextarea';

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  argTypes: {
    displaySize: {
      control: { type: 'select' },
    },
    resize: {
      control: { type: 'select' },
    },
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    const ref = useRef(null);
    return (
      <Textarea
        {...args}
        ref={ref}
        value={value}
        onChange={(evt: any) => {
          action('onChange')(evt.currentTarget);
          action('ref.current.value')((ref.current as any).value);
          setValue(evt.currentTarget.value);
        }}
      />
    );
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

/** Sans aucune props renseignée */
export const Default: Story = {};

/** Avec une aide à la saisie quand le champ est vide */
export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Saisir une valeur',
  },
};

/** Avec une valeur */
export const WithValue: Story = {
  args: {
    value: 'Test',
    onChange: action('onChange'),
  },
};

/** Variante en fonction de l'état */
export const WithColorBorders: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Textarea placeholder="Info" state="info" />
      <Textarea placeholder="Error" state="error" />
      <Textarea placeholder="Success" state="success" />
      <Textarea placeholder="Warning" state="warning" />
    </div>
  ),
};

/** Variante small */
export const SmallVariant: Story = {
  args: {
    placeholder: 'Small',
    displaySize: 'sm',
  },
};

/** Avec redimensionnement automatique du champ lors de la saisie */
export const WithAutoResize: Story = {
  render: () => <AutoResizedTextarea />,
};
