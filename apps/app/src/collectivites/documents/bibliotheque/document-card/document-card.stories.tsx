import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DocumentCard } from '.';
import {
  preuveReglementaireFichier,
  preuveReglementaireFichierConfidentiel,
  preuveReglementaireFichierManquant,
  preuveReglementaireLien,
} from '../documents.fixture';

export default {
  component: DocumentCard,
  args: { actions: { edit: true, comment: true, remove: true } },
  decorators: [
    (Story) => (
      <div className="w-[26rem] p-8">
        <Story />
      </div>
    ),
  ],
} as Meta<typeof DocumentCard>;

type Story = StoryObj<typeof DocumentCard>;

export const Fichier: Story = {
  args: { document: preuveReglementaireFichier },
};

export const Lien: Story = {
  args: { document: preuveReglementaireLien },
};

/** Le badge est rendu par `MissingFileBadge`, partagé avec la carte de rapport et la ligne de preuve. */
export const FichierIntrouvable: Story = {
  args: { document: preuveReglementaireFichierManquant },
};

/** Le cadenas reste une `Notification` du DS, en coin de carte. */
export const FichierConfidentiel: Story = {
  args: { document: preuveReglementaireFichierConfidentiel },
};

export const FichierIntrouvableAvecIdentifiant: Story = {
  args: {
    document: preuveReglementaireFichierManquant,
    identifier: '1.1.3',
  },
};
