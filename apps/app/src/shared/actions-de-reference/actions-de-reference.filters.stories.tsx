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
    search: { searchedText: '', leviers: [], categories: [], sortBy: 'titre' },
  },
};

export const RechercheFiltreeEtTriee: Story = {
  args: {
    search: {
      searchedText: 'combles',
      leviers: ['sobriete_isolation_batiments_tertiaire', 'covoiturage'],
      categories: ['exemplarite', 'amenagement'],
      sortBy: 'levier',
    },
  },
};
