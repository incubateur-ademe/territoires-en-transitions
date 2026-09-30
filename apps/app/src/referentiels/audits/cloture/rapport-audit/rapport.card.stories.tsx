import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import {
  rapportFichierManquantAuNomLong,
  rapportFichier,
  rapportFichierManquant,
  rapportLien,
} from './rapports.fixture';
import { PersistedRapportCard } from './rapport.card';

export default {
  component: PersistedRapportCard,
  args: { isRemoving: false, onRemove: fn() },
  decorators: [
    (Story) => (
      <div className="w-[36rem] p-4">
        <Story />
      </div>
    ),
  ],
} as Meta<typeof PersistedRapportCard>;

type Story = StoryObj<typeof PersistedRapportCard>;

export const RapportFichier: Story = {
  args: { report: rapportFichier },
};

export const RapportLien: Story = {
  args: { report: rapportLien },
};

/** Le fichier est référencé mais sa ligne de bibliothèque n'est plus résoluble. */
export const RapportIntrouvable: Story = {
  args: { report: rapportFichierManquant },
};

export const SuppressionEnCours: Story = {
  args: { report: rapportFichier, isRemoving: true },
};

/** Le titre passe à la ligne : badge et corbeille se centrent sur l'ensemble. */
export const RapportAuNomLong: Story = {
  args: { report: rapportFichierManquantAuNomLong },
};
