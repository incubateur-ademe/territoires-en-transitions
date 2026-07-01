import {
  cellKey,
  CellKey,
  GridCell,
  GridRowGroup,
  IndicateurId,
  Year,
} from './types';

export type GridDisplayRow = {
  indicateurId: IndicateurId;
  rowLabel: string;
  groupId: string;
  groupLabel: string;
  isGroupStart: boolean;
  groupSize: number;
};

export const toDisplayRows = (groups: GridRowGroup[]): GridDisplayRow[] =>
  groups.flatMap((group) =>
    group.rows.map((row, index) => ({
      indicateurId: row.indicateurId,
      rowLabel: row.label,
      groupId: group.id,
      groupLabel: group.label,
      isGroupStart: index === 0,
      groupSize: group.rows.length,
    }))
  );

export const findCell = ({
  cells,
  indicateurId,
  year,
}: {
  cells: Map<CellKey, GridCell>;
  indicateurId: IndicateurId;
  year: Year;
}): GridCell | null => cells.get(cellKey(indicateurId, year)) ?? null;
