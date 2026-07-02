import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { arrayMove } from '@dnd-kit/sortable';
import { Button } from '@tet/ui';
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
  parseCellKey,
  CellKey,
  CellValueInput,
  GridCell,
  GridRowGroup,
  IndicateurValuesGridActions,
  Year,
} from '../types';

const meta: Meta<typeof IndicateurValuesGrid> = {
  title: 'Indicateurs/Grille de saisie',
  component: IndicateurValuesGrid,
};

export default meta;

type Story = StoryObj<typeof IndicateurValuesGrid>;

type GridState = {
  years: Year[];
  referenceYear: Year;
  cells: Map<CellKey, GridCell>;
};

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

const rekeyReferenceColumn = ({
  cells,
  referenceYear,
  nextYear,
}: {
  cells: Map<CellKey, GridCell>;
  referenceYear: Year;
  nextYear: Year;
}): Map<CellKey, GridCell> =>
  new Map(
    Array.from(cells, ([key, cell]) => {
      const parsed = parseCellKey(key);
      const belongsToReferenceColumn =
        parsed !== null && parsed.year === referenceYear;
      const nextKey = belongsToReferenceColumn
        ? generateCellKey(parsed.indicateurId, nextYear)
        : key;
      return [nextKey, cell] as const;
    })
  );

const InteractiveGrid = (): JSX.Element => {
  const [state, setState] = useState<GridState>(() => ({
    years: fakeYears,
    referenceYear: fakeReferenceYear,
    cells: fakeCells(),
  }));
  const [groups, setGroups] = useState<GridRowGroup[]>(fakeGroups);

  const actions = useMemo<IndicateurValuesGridActions>(
    () => ({
      ...fakeGridActions,
      saveCellValue: async (input) => {
        setState((previous) => ({
          ...previous,
          cells: withValues(previous.cells, [input]),
        }));
        return { ok: true, value: undefined };
      },
      saveCellValues: async (inputs) => {
        window.alert(
          `Collage : ${inputs.length} valeur(s) ecrite(s)\n` +
            inputs
              .map((input) => `${input.indicateurId} / ${input.year} = ${input.resultat}`)
              .join('\n')
        );
        setState((previous) => ({
          ...previous,
          cells: withValues(previous.cells, inputs),
        }));
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

  const onReferenceYearChange = useCallback((nextYear: Year): void => {
    setState((previous) => {
      const isNoOp =
        nextYear === previous.referenceYear ||
        previous.years.includes(nextYear);
      if (isNoOp) {
        return previous;
      }
      return {
        years: previous.years.map((year) =>
          year === previous.referenceYear ? nextYear : year
        ),
        referenceYear: nextYear,
        cells: rekeyReferenceColumn({
          cells: previous.cells,
          referenceYear: previous.referenceYear,
          nextYear,
        }),
      };
    });
  }, []);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button size="xs" variant="outlined" onClick={resetRowOrder}>
        {"Réinitialiser l'ordre des polluants"}
      </Button>
      <IndicateurValuesGrid
        groups={groups}
        years={state.years}
        referenceYear={state.referenceYear}
        unit="t/an"
        cells={state.cells}
        actions={actions}
        notify={(message) => window.alert(message)}
        onReorderRows={onReorderRows}
        onReferenceYearChange={onReferenceYearChange}
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
