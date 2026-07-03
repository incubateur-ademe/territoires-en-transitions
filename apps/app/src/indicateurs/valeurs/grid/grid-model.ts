import {
  generateCellKey,
  CellKey,
  GridCell,
  GridInput,
  GridRowGroup,
  IndicateurId,
  Year,
} from './types';

export const FLAT_GROUP_ID = '__flat__';

export type NormalizedGridInput = {
  groups: GridRowGroup[];
  isGrouped: boolean;
};

export const normalizeGridInput = (input: GridInput): NormalizedGridInput =>
  Array.isArray(input)
    ? {
        groups: [{ id: FLAT_GROUP_ID, label: '', rows: input }],
        isGrouped: false,
      }
    : {
        groups: Object.entries(input).map(([id, { label, rows }]) => ({
          id,
          label,
          rows,
        })),
        isGrouped: true,
      };

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
}): GridCell | null => cells.get(generateCellKey(indicateurId, year)) ?? null;
