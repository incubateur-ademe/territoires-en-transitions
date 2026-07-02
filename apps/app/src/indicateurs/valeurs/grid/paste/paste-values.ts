import { findCell, toDisplayRows } from '../grid-model';
import { parseCellNumber } from '../parse-cell-number';
import {
  CellKey,
  GridCell,
  GridRowGroup,
  IndicateurId,
  CellValueInput,
  Year,
} from '../types';

export type PasteOutcome = { cellsToWrite: CellValueInput[]; skipped: number };

const parseClipboard = (text: string): string[][] =>
  text
    .replace(/\r\n?/g, '\n')
    .replace(/\n+$/, '')
    .split('\n')
    .map((line) => line.split('\t'));

export const pasteValues = ({
  text,
  anchorIndicateurId,
  anchorYear,
  groups,
  years,
  cells,
}: {
  text: string;
  anchorIndicateurId: IndicateurId;
  anchorYear: Year;
  groups: GridRowGroup[];
  years: Year[];
  cells: Map<CellKey, GridCell>;
}): PasteOutcome => {
  if (text.trim() === '') {
    return { cellsToWrite: [], skipped: 0 };
  }
  const rows = toDisplayRows(groups);
  const anchorRow = rows.findIndex((row) => row.indicateurId === anchorIndicateurId);
  const anchorColumn = years.findIndex((year) => year === anchorYear);
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
      const year = years[anchorColumn + columnOffset];
      if (row === undefined || year === undefined) {
        return [];
      }
      const cell = findCell({ cells, indicateurId: row.indicateurId, year });
      if (cell === null) {
        return [];
      }
      const resultat = parseCellNumber(raw);
      if (resultat === null) {
        return [];
      }
      const valueId = cell.kind === 'user-data' ? cell.valueId : undefined;
      return [{ indicateurId: row.indicateurId, valueId, year, resultat }];
    })
  );
  return { cellsToWrite, skipped: pastedValueCount - cellsToWrite.length };
};
