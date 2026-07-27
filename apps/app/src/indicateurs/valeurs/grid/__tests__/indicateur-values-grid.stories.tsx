import { Meta, StoryObj } from '@storybook/nextjs-vite';
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
import {
  generateCellKey,
  parseCellKey,
  toIndicateurId,
  CellKey,
  CellValueInput,
  GridCell,
  GridRow,
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
  inputs.forEach(({ indicateurId, year, field, value }) => {
    const key = generateCellKey(indicateurId, year);
    const current = next.get(key) ?? { resultat: null, objectif: null };
    next.set(key, { ...current, [field]: value });
  });
  return next;
};

const refetchedReferenceValue = (indicateurId: number, year: number): number =>
  Math.round(180 + (indicateurId % 6) * 40 + (year % 12) * 9);

const refetchReferenceColumn = ({
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
      const { indicateurId, year } = parseCellKey(key);
      if (year !== referenceYear) {
        return [key, cell] as const;
      }
      const refetchedCell: GridCell = {
        resultat: refetchedReferenceValue(indicateurId, nextYear),
        objectif: cell.objectif,
      };
      return [generateCellKey(indicateurId, nextYear), refetchedCell] as const;
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
              .map(
                (input) =>
                  `${input.indicateurId} / ${input.year} / ${input.field} = ${input.value}`
              )
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
        cells: refetchReferenceColumn({
          cells: previous.cells,
          referenceYear: previous.referenceYear,
          nextYear,
        }),
      };
    });
  }, []);

  const onAddYear = useCallback((year: Year): void => {
    setState((previous) => {
      if (previous.years.includes(year)) {
        return previous;
      }
      return {
        ...previous,
        years: [...previous.years, year].sort((a, b) => a - b),
      };
    });
  }, []);

  const onRemoveYear = useCallback((year: Year): void => {
    setState((previous) => ({
      ...previous,
      years: previous.years.filter((candidate) => candidate !== year),
    }));
  }, []);

  const canRemoveYear = useCallback(
    (year: Year): boolean => year !== state.referenceYear,
    [state.referenceYear]
  );

  return (
    <IndicateurValuesGrid
      rows={toGridInput(fakeGroups)}
      years={state.years}
      referenceYear={state.referenceYear}
      unit="t/an"
      cells={state.cells}
      actions={actions}
      notify={(message) => window.alert(message)}
      onReferenceYearChange={onReferenceYearChange}
      onAddYear={onAddYear}
      onRemoveYear={onRemoveYear}
      canRemoveYear={canRemoveYear}
    />
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
