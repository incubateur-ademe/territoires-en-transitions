import { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TableFull } from './table-full';
import { TableFullWithFilters } from './table-full.with-filters';
import { TableTree } from './table-tree';

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

/**
 * Hiérarchie sur un seul sous-niveau. Trois pièces, toutes dans la première
 * colonne, qui doit être `pinnedLeft` :
 *
 * - `TableTreeBranch`, premier enfant de la cellule d'une ligne fille, trace
 *   le trait vertical et le coude. Il se positionne en absolu sur la cellule,
 *   dont le `sticky` de `pinnedLeft` fait l'ancre — d'où cette contrainte.
 *   Passer `isLast` sur la dernière de la fratrie pour refermer le trait.
 * - `tableTreeChildIndentClassName` décale le contenu après le coude.
 * - `TableTreeToggle` porte le repli sur la ligne parente. Il reprend la
 *   flèche de l'`Accordion`, qu'on ne peut pas employer ici : celui-ci
 *   enveloppe son contenu dans un conteneur, ce qu'un `<tr>` n'admet pas.
 *
 * L'aplatissement de l'arbre reste à l'appelant : c'est lui qui sait ce qu'il
 * range et dans quel ordre. Les traits sont décoratifs et masqués au lecteur
 * d'écran — porter la hiérarchie dans le nom accessible de la ligne.
 */
export const Tree: StoryObj<typeof TableTree> = {
  render: () => <TableTree />,
};
