import { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Button } from '../Button';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  component: Alert,
  argTypes: {
    state: { control: 'select' },
  },
  args: {
    title: 'Titre',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed dignissim blandit placerat. Cras dolor enim, luctus elementum fringilla vitae, sollicitudin eu leo. Nullam eget accumsan risus. Cras pulvinar molestie euismod. Proin nec semper mauris. Nulla venenatis sed massa posuere faucibus.',
  },
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {};

export const Error: Story = {
  args: { state: 'error' },
};

export const Success: Story = {
  args: { state: 'success' },
};

export const Warning: Story = {
  args: { state: 'warning' },
};

export const ControlledByParent: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);

    return isOpen ? (
      <Alert {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    ) : (
      <Button variant="outlined" onClick={() => setIsOpen(true)}>
        Ouvrir l'alerte
      </Button>
    );
  },
};

export const WithDescriptionAsComponent: Story = {
  args: {
    description: (
      <>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed dignissim
          blandit placerat. Cras dolor enim, luctus elementum fringilla vitae,
          sollicitudin eu leo. Nullam eget accumsan risus. Cras pulvinar
          molestie euismod. Proin nec semper mauris. Nulla venenatis sed massa
          posuere faucibus.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed dignissim
          blandit placerat. Cras dolor enim, luctus elementum fringilla vitae,
          sollicitudin eu leo. Nullam eget accumsan risus. Cras pulvinar
          molestie euismod. Proin nec semper mauris. Nulla venenatis sed massa
          posuere faucibus.
        </p>
      </>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    footer: (
      <div className="flex gap-4 my-2">
        <Button size="xs">Valider</Button>
        <Button size="xs" variant="outlined">
          Annuler
        </Button>
      </div>
    ),
  },
};
