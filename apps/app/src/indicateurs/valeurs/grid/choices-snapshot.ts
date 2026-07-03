import { CellKey, GridCell, IndicateurId, Year, parseCellKey } from './types';

export type ChoiceSource = { sourceId: string; libelle: string };

export type IndicateurYearChoice = {
  year: Year;
  value: number;
  source: ChoiceSource | null;
};

export type IndicateurChoicesSnapshot = Record<IndicateurId, IndicateurYearChoice[]>;

const toYearValue = (
  cell: GridCell
): { value: number; source: ChoiceSource | null } | null => {
  if (cell.kind === 'open-data') {
    return {
      value: cell.value,
      source: { sourceId: cell.selectedSourceId, libelle: cell.source.libelle },
    };
  }
  if (cell.value === null) {
    return null;
  }
  return { value: cell.value, source: null };
};

export const toChoicesSnapshot = (
  cells: Map<CellKey, GridCell>
): IndicateurChoicesSnapshot =>
  Array.from(cells)
    .flatMap(([key, cell]) => {
      const yearValue = toYearValue(cell);
      if (yearValue === null) {
        return [];
      }
      const { indicateurId, year } = parseCellKey(key);
      return [{ indicateurId, year, ...yearValue }];
    })
    .reduce<IndicateurChoicesSnapshot>(
      (snapshot, { indicateurId, ...yearChoice }) => ({
        ...snapshot,
        [indicateurId]: [...(snapshot[indicateurId] ?? []), yearChoice],
      }),
      {}
    );
