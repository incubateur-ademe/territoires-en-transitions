import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { JSX, useMemo, useState } from 'react';
import {
  fakeCells,
  fakeGridActions,
  fakeGroups,
  fakeReferenceYear,
  fakeYears,
} from './grid-fixtures';
import { IndicateurValuesGrid } from '../indicateur-values-grid';
import { cellKey, CellKey, GridCell, IndicateurValuesGridActions } from '../types';

const meta: Meta<typeof IndicateurValuesGrid> = {
  title: 'Indicateurs/Grille de saisie',
  component: IndicateurValuesGrid,
};

export default meta;

type Story = StoryObj<typeof IndicateurValuesGrid>;

const InteractiveGrid = (): JSX.Element => {
  const [cells, setCells] = useState<Map<CellKey, GridCell>>(() => fakeCells());
  const actions = useMemo<IndicateurValuesGridActions>(
    () => ({
      ...fakeGridActions,
      writeCell: async ({ indicateurId, valueId, year, resultat }) => {
        setCells((previous) => {
          const key = cellKey(indicateurId, year);
          const current = previous.get(key);
          const coveringSources =
            current?.kind === 'user-data' ? current.coveringSources : [];
          const nextValueId = valueId ?? indicateurId * 1000 + year;
          const updatedCell: GridCell =
            resultat === null
              ? { kind: 'user-data', value: null, valueId: nextValueId, coveringSources }
              : { kind: 'user-data', value: resultat, valueId: nextValueId, coveringSources };
          const next = new Map(previous);
          next.set(key, updatedCell);
          return next;
        });
        return { ok: true, value: undefined };
      },
    }),
    []
  );
  return (
    <IndicateurValuesGrid
      groups={fakeGroups}
      years={fakeYears}
      referenceYear={fakeReferenceYear}
      unit="t/an"
      cells={cells}
      actions={actions}
    />
  );
};

export const Polluants: Story = {
  render: () => <InteractiveGrid />,
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
