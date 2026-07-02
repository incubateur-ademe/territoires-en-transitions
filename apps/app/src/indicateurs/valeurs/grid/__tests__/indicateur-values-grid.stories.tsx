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
import {
  generateCellKey,
  CellKey,
  CellValueInput,
  GridCell,
  IndicateurValuesGridActions,
} from '../types';

const meta: Meta<typeof IndicateurValuesGrid> = {
  title: 'Indicateurs/Grille de saisie',
  component: IndicateurValuesGrid,
};

export default meta;

type Story = StoryObj<typeof IndicateurValuesGrid>;

const withValues = (
  previous: Map<CellKey, GridCell>,
  inputs: CellValueInput[]
): Map<CellKey, GridCell> => {
  const next = new Map(previous);
  inputs.forEach(({ indicateurId, valueId, year, resultat }) => {
    const key = generateCellKey(indicateurId, year);
    const current = next.get(key);
    const coveringSources =
      current?.kind === 'user-data' ? current.coveringSources : [];
    const nextValueId = valueId ?? indicateurId * 1000 + year;
    next.set(
      key,
      resultat === null
        ? { kind: 'user-data', value: null, valueId: nextValueId, coveringSources }
        : {
            kind: 'user-data',
            value: resultat,
            valueId: nextValueId,
            coveringSources,
          }
    );
  });
  return next;
};

const InteractiveGrid = (): JSX.Element => {
  const [cells, setCells] = useState<Map<CellKey, GridCell>>(() => fakeCells());
  const actions = useMemo<IndicateurValuesGridActions>(
    () => ({
      ...fakeGridActions,
      saveCellValue: async (input) => {
        setCells((previous) => withValues(previous, [input]));
        return { ok: true, value: undefined };
      },
      saveCellValues: async (inputs) => {
        window.alert(
          `Collage : ${inputs.length} valeur(s) ecrite(s)\n` +
            inputs
              .map((input) => `${input.indicateurId} / ${input.year} = ${input.resultat}`)
              .join('\n')
        );
        setCells((previous) => withValues(previous, inputs));
        return { ok: true, value: { written: inputs.length, failed: [] } };
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
      notify={(message) => window.alert(message)}
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
