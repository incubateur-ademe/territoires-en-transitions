import { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  fakeCells,
  fakeGridActions,
  fakeGroups,
  fakeReferenceYear,
  fakeYears,
} from './grid-fixtures';
import { IndicateurValuesGrid } from '../indicateur-values-grid';

const meta: Meta<typeof IndicateurValuesGrid> = {
  title: 'Indicateurs/Grille de saisie',
  component: IndicateurValuesGrid,
};

export default meta;

type Story = StoryObj<typeof IndicateurValuesGrid>;

export const Polluants: Story = {
  args: {
    groups: fakeGroups,
    years: fakeYears,
    referenceYear: fakeReferenceYear,
    unit: 't/an',
    cells: fakeCells(),
    actions: fakeGridActions,
  },
};

export const Vide: Story = {
  args: {
    groups: fakeGroups,
    years: fakeYears,
    referenceYear: fakeReferenceYear,
    unit: 't/an',
    cells: new Map(),
    actions: fakeGridActions,
  },
};
