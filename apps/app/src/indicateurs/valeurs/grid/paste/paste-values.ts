import { findCell, toDisplayRows } from '../grid-model';
import { parseCellNumber } from '../parse-cell-number';
import {
  CellKey,
  GridCell,
  GridRowGroup,
  IndicateurId,
  CellValueInput,
  Year,
  ValeurField,
} from '../types';

export type PasteOutcome = { cellsToWrite: CellValueInput[]; skipped: number };

const parseClipboard = (text: string): string[][] =>
  text
    .replace(/\r\n?/g, '\n')
    .replace(/\n+$/, '')
    .split('\n')
    .map((line) => line.split('\t'));

type FieldColumn = { year: Year; field: ValeurField };

const buildFieldColumns = (years: Year[]): FieldColumn[] =>
  years.flatMap((year) => [
    { year, field: 'resultat' as const },
    { year, field: 'objectif' as const },
  ]);

export const pasteValues = ({
  text,
  anchorIndicateurId,
  anchorYear,
  anchorField,
  groups,
  years,
  cells,
}: {
  text: string;
  anchorIndicateurId: IndicateurId;
  anchorYear: Year;
  anchorField: ValeurField;
  groups: GridRowGroup[];
  years: Year[];
  cells: Map<CellKey, GridCell>;
}): PasteOutcome => {
  if (text.trim() === '') {
    return { cellsToWrite: [], skipped: 0 };
  }
  const rows = toDisplayRows(groups);
  const fieldColumns = buildFieldColumns(years);
  const anchorRow = rows.findIndex((row) => row.indicateurId === anchorIndicateurId);
  const anchorColumn = fieldColumns.findIndex(
    (column) => column.year === anchorYear && column.field === anchorField
  );
  if (anchorRow === -1 || anchorColumn === -1) {
    return { cellsToWrite: [], skipped: 0 };
  }
  const pasted = parseClipboard(text);
  const pastedValueCount = pasted.reduce(
    (total, line) => total + line.filter((raw) => raw.trim() !== '').length,
    0
  );
  const cellsToWrite = pasted.flatMap((line, rowOffset) =>
    line.flatMap((raw, columnOffset) => {
      const row = rows[anchorRow + rowOffset];
      const targetColumn = fieldColumns[anchorColumn + columnOffset];
      if (row === undefined || targetColumn === undefined) {
        return [];
      }
      const cell = findCell({ cells, indicateurId: row.indicateurId, year: targetColumn.year });
      if (cell === null) {
        return [];
      }
      const value = parseCellNumber(raw);
      if (value === null) {
        return [];
      }
      return [
        {
          indicateurId: row.indicateurId,
          year: targetColumn.year,
          field: targetColumn.field,
          value,
        },
      ];
    })
  );
  return { cellsToWrite, skipped: pastedValueCount - cellsToWrite.length };
};
