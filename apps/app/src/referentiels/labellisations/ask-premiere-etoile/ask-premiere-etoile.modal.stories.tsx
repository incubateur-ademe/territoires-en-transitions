import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AskPremiereEtoileModalContent } from './ask-premiere-etoile.modal';

const meta: Meta<typeof AskPremiereEtoileModalContent> = {
  component: AskPremiereEtoileModalContent,
  args: {
    isCOT: false,
    collectiviteId: 1,
    referentiel: 'eci',
  },
};

export default meta;

type Story = StoryObj<typeof AskPremiereEtoileModalContent>;

export const Demandable: Story = {
  args: { status: 'non_demandee' },
};

export const DemandeEnvoyee: Story = {
  args: { status: 'demande_envoyee' },
};

export const CollectiviteCOT: Story = {
  args: { isCOT: true, status: 'non_demandee' },
};
