import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {Textarea} from './Textarea';
import {useRef, useState} from 'react';
import {Input} from '@design-system/Input';

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  argTypes: {
    displaySize: {
      control: {type: 'select'},
    },
    resize: {
      control: {type: 'select'},
    },
  },
  render: args => {
    const [value, setValue] = useState(args.value);
    const ref = useRef(null);
    return (
      <Textarea
        {...args}
        ref={ref}
        value={value}
        onChange={e => {
          console.log(e);

          action('onChange')(e.target);
          action('ref.current.value')(ref.current.value);
          //   setValue(e);
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
