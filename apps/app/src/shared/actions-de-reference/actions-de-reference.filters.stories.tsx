import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ActionsDeReferenceFilters } from './actions-de-reference.filters';

const meta: Meta<typeof ActionsDeReferenceFilters> = {
  component: ActionsDeReferenceFilters,
  args: {
    onSearchChange: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof ActionsDeReferenceFilters>;

export const SansRecherche: Story = {
  args: {
    search: { texte: '', leviers: [], categories: [], sortBy: 'titre' },
  },
};

export const RechercheFiltreeEtTriee: Story = {
  args: {
    search: {
      texte: 'combles',
      leviers: ['sobriete_isolation_batiments_tertiaire', 'covoiturage'],
      categories: ['exemplarite', 'amenagement'],
      sortBy: 'levier',
    },
  },
};
