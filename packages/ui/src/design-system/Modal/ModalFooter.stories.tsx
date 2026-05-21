import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '../Button';
import { ModalFooter, ModalFooterSection } from './ModalFooter';

const meta: Meta<typeof ModalFooter> = {
  component: ModalFooter,
};

export default meta;

type Story = StoryObj<typeof ModalFooter>;

export const Default: Story = {
  args: {
    variant: 'right',
    children: [
      <Button key="cancel" size="xs" variant="outlined">
        Cancel
      </Button>,
      <Button key="ok" size="xs">
        OK
      </Button>,
    ],
  },
};

export const Center: Story = {
  args: {
    variant: 'center',
    children: <Button size="xs">OK</Button>,
  },
};

export const Space: Story = {
  args: {
    variant: 'space',
    children: [
      <ModalFooterSection key="section">
        <Button size="xs" variant="outlined">
          Non pertinent
        </Button>
        <Button size="xs" variant="outlined">
          En cours
        </Button>
        <Button size="xs" variant="outlined">
          Réalisé
        </Button>
      </ModalFooterSection>,
      <Button key="add" size="xs" icon="file-add-fill">
        Ajouter
      </Button>,
    ],
  },
};

export const AvecContenuOptionnel: Story = {
  args: {
    variant: 'right',
    content: [<p key="content">Contenu optionnel</p>],
    children: [
      <Button key="cancel" size="xs" variant="outlined">
        Cancel
      </Button>,
      <Button key="ok" size="xs">
        OK
      </Button>,
    ],
  },
};
