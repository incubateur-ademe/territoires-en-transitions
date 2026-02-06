import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ComponentProps, useState } from 'react';
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

const RenderControlledByParent = (args: ComponentProps<typeof Alert>) => {
  const [isOpen, setIsOpen] = useState(false);

  return isOpen ? (
    <div className="flex flex-col gap-2">
      <Alert {...args} />
      <Button variant="outlined" onClick={() => setIsOpen(false)}>
        Fermer l&apos;alerte
      </Button>
    </div>
  ) : (
    <Button variant="outlined" onClick={() => setIsOpen(true)}>
      Ouvrir l&apos;alerte
    </Button>
  );
};

export const ControlledByParent: Story = {
  render: (args) => <RenderControlledByParent {...args} />,
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
