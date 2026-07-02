import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@tet/ui';
import { arrayMove } from '@dnd-kit/sortable';
import { JSX, useCallback, useMemo, useState } from 'react';
import {
  fakeCells,
  fakeGridActions,
  fakeGroups,
  fakeReferenceYear,
  fakeYears,
} from './grid-fixtures';
import { IndicateurValuesGrid } from '../indicateur-values-grid';
import { rowDragId } from '../use-grid-reorder';
import {
  generateCellKey,
  CellKey,
  CellValueInput,
  GridCell,
  GridRowGroup,
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
  const [groups, setGroups] = useState<GridRowGroup[]>(fakeGroups);

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

  const onReorderRows = useCallback(
    (groupId: string, activeId: string, overId: string) => {
      setGroups((previous) => {
        const group = previous.find((candidate) => candidate.id === groupId);
        if (group === undefined) {
          return previous;
        }
        const dragIds = group.rows.map((row) => rowDragId(row.indicateurId));
        const from = dragIds.findIndex((id) => id === activeId);
        const to = dragIds.findIndex((id) => id === overId);
        if (from === -1 || to === -1) {
          return previous;
        }
        return previous.map((candidate) => ({
          ...candidate,
          rows: arrayMove(candidate.rows, from, to),
        }));
      });
    },
    []
  );

  const resetRowOrder = useCallback(() => setGroups(fakeGroups), []);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button size="xs" variant="outlined" onClick={resetRowOrder}>
        {"Réinitialiser l'ordre des polluants"}
      </Button>
      <IndicateurValuesGrid
        groups={groups}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        unit="t/an"
        cells={cells}
        actions={actions}
        notify={(message) => window.alert(message)}
        onReorderRows={onReorderRows}
      />
    </div>
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
