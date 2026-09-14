import { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TableFull } from './table-full';
import { TableFullWithFilters } from './table-full.with-filters';

const meta: Meta<typeof TableFull> = {
  component: TableFull,
  title: 'Design System/Table',
};

export default meta;

type Story = StoryObj<typeof TableFull>;

export const Default: Story = {};

export const Loading: Story = {
  render: () => <TableFull isLoading={true} />,
};

export const Empty: Story = {
  render: () => <TableFull isEmpty={true} />,
};

/** Tri et filtres portés par l'en-tête, pilotés par l'appelant. */
export const WithHeaderFilters: StoryObj<typeof TableFullWithFilters> = {
  render: () => <TableFullWithFilters />,
};

/**
 * L'en-tête — donc les filtres — reste affiché quand rien ne ressort : sans
 * lui, l'agent n'aurait aucun moyen de desserrer ce qu'il vient de poser.
 */
export const WithHeaderFiltersEmpty: StoryObj<typeof TableFullWithFilters> = {
  render: () => (
    <TableFullWithFilters
      filtresInitiaux={{ statuts: ['Terminé'], pilotes: ['EcoRénov'] }}
    />
  ),
};
