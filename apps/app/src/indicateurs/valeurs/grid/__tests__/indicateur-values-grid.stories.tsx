import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { arrayMove } from '@dnd-kit/sortable';
import { Button } from '@tet/ui';
import { JSX, useCallback, useMemo, useState } from 'react';
import {
  fakeCells,
  fakeCellsForGroups,
  fakeGridActions,
  fakeGroups,
  fakeGroupsInput,
  fakeReferenceYear,
  fakeYears,
  toGridInput,
} from './grid-fixtures';
import { IndicateurValuesGrid } from '../indicateur-values-grid';
import { rowDragId } from '../drag-reorder/use-grid-reorder';
import {
  generateCellKey,
  parseCellKey,
  toIndicateurId,
  SelectOpenDataInput,
  CellKey,
  CellValueInput,
  GridCell,
  GridRow,
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

const selectOpenDataInCells = (
  cells: Map<CellKey, GridCell>,
  { indicateurId, year, sourceId }: SelectOpenDataInput
): Map<CellKey, GridCell> => {
  const key = generateCellKey(indicateurId, year);
  const current = cells.get(key);
  if (current === undefined) {
    return cells;
  }
  const chosen = current.coveringSources.find(
    (source) => source.sourceId === sourceId
  );
  if (chosen === undefined) {
    return cells;
  }
  const next = new Map(cells);
  next.set(key, {
    kind: 'open-data',
    value: chosen.value,
    selectedSourceId: chosen.sourceId,
    source: {
      sourceId: chosen.sourceId,
      libelle: chosen.libelle,
      methodologie: chosen.methodologie,
      dateVersion: chosen.dateVersion,
    },
    coveringSources: current.coveringSources,
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

type GridState = {
  years: Year[];
  referenceYear: Year;
  cells: Map<CellKey, GridCell>;
};

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
      selectOpenData: async (input) => {
        setState((previous) => ({
          ...previous,
          cells: selectOpenDataInCells(previous.cells, input),
        }));
        return { ok: true, value: undefined };
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
        rows={toGridInput(groups)}
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

const secteurLabels = [
  'Résidentiel',
  'Tertiaire',
  'Transport routier',
  'Agriculture',
  'Industrie',
];

const polluantLabels = ['NOx', 'PM10'] as const;
type PolluantLabel = (typeof polluantLabels)[number];

const secteurRows = (firstIndicateurId: number): GridRow[] =>
  secteurLabels.map((secteur, index) => ({
    indicateurId: toIndicateurId(firstIndicateurId + index),
    label: secteur,
  }));

const rowsByPolluant: Record<PolluantLabel, GridRow[]> = {
  NOx: secteurRows(100),
  PM10: secteurRows(200),
};

const PolluantSwitchGrid = (): JSX.Element => {
  const [selectedPolluant, setSelectedPolluant] =
    useState<PolluantLabel>('NOx');
  const [cells, setCells] = useState<Map<CellKey, GridCell>>(() =>
    fakeCellsForGroups(
      polluantLabels.map((polluant) => ({
        id: polluant,
        label: polluant,
        rows: rowsByPolluant[polluant],
      }))
    )
  );

  const actions = useMemo<IndicateurValuesGridActions>(
    () => ({
      ...fakeGridActions,
      saveCellValue: async (input) => {
        setCells((previous) => withValues(previous, [input]));
        return { ok: true, value: undefined };
      },
      saveCellValues: async (inputs) => {
        setCells((previous) => withValues(previous, inputs));
        return { ok: true, value: { written: inputs.length, failed: [] } };
      },
      selectOpenData: async (input) => {
        setCells((previous) => selectOpenDataInCells(previous, input));
        return { ok: true, value: undefined };
      },
    }),
    []
  );

  return (
    <div className="flex flex-col items-start gap-2">
      <div role="group" aria-label="Choix du polluant" className="flex gap-2">
        {polluantLabels.map((polluant) => {
          const isSelected = polluant === selectedPolluant;
          return (
            <Button
              key={polluant}
              size="xs"
              variant={isSelected ? 'primary' : 'outlined'}
              aria-pressed={isSelected}
              onClick={() => setSelectedPolluant(polluant)}
            >
              {polluant}
            </Button>
          );
        })}
      </div>
      <IndicateurValuesGrid
        rows={rowsByPolluant[selectedPolluant]}
        years={fakeYears}
        referenceYear={fakeReferenceYear}
        unit="t/an"
        cells={cells}
        actions={actions}
        notify={(message) => window.alert(message)}
      />
    </div>
  );
};

export const SwitchEntrePolluants: Story = {
  render: () => <PolluantSwitchGrid />,
};

export const Vide: Story = {
  args: {
    rows: fakeGroupsInput,
    years: fakeYears,
    referenceYear: fakeReferenceYear,
    unit: 't/an',
    cells: new Map(),
    actions: fakeGridActions,
  },
};
