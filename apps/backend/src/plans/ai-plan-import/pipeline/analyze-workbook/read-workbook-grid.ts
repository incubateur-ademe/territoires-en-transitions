import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TimeoutError, withTimeout } from 'es-toolkit';
import ExcelJS from 'exceljs';
import { cleanText } from '../normalize-text/clean-text';
import {
  GridCell,
  GridCellKind,
  GridRange,
  isBlankGridRow,
  SheetGrid,
  SheetState,
} from './sheet-grid';

const EXCEL_TIMEOUT_MS = 30_000;
// Bien au-delà d'un plan d'actions ; une valeur égarée en XFD1048576
// allouerait sinon des milliards de cellules.
export const MAX_GRID_ROWS = 5_000;
export const MAX_GRID_COLS = 100;

export type ReadWorkbookError = { kind: 'parse_failed' } | { kind: 'timeout' };

/** Chaque onglet qui porte au moins une valeur, dans l'ordre du classeur. */
export const readWorkbookGrids = async (
  buffer: Buffer
): Promise<Result<SheetGrid[], ReadWorkbookError>> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await withTimeout(
      () => workbook.xlsx.load(buffer as unknown as ArrayBuffer),
      EXCEL_TIMEOUT_MS
    );
    return success(
      workbook.worksheets
        .map(worksheetToGrid)
        .filter((grid) => grid.cells.some((row) => !isBlankGridRow(row)))
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      return failure({ kind: 'timeout' });
    }
    return failure({ kind: 'parse_failed' });
  }
};

export const worksheetToGrid = (worksheet: ExcelJS.Worksheet): SheetGrid => {
  const allMerges = (worksheet.model.merges ?? []).map(parseRange);
  const extent = contentExtent(worksheet, allMerges);
  const rowCount = Math.min(extent.rowCount, MAX_GRID_ROWS);
  const colCount = Math.min(extent.colCount, MAX_GRID_COLS);
  const merges = clampMerges(allMerges, rowCount, colCount);
  const mergeAt = indexMerges(merges);
  const cells = Array.from({ length: rowCount }, (_, rowIndex) => {
    const row = worksheet.getRow(rowIndex + 1);
    return Array.from({ length: colCount }, (_, colIndex) =>
      toGridCell(
        row.getCell(colIndex + 1),
        rowIndex + 1,
        colIndex + 1,
        mergeAt.get(`${rowIndex + 1}:${colIndex + 1}`),
        worksheet.name
      )
    );
  });
  return {
    name: worksheet.name,
    state: toSheetState(worksheet.state),
    cells,
    rowCount,
    colCount,
    merges,
    ...(rowCount < extent.rowCount || colCount < extent.colCount
      ? { truncatedFrom: extent }
      : {}),
  };
};

const clampMerges = (
  merges: GridRange[],
  rowCount: number,
  colCount: number
): GridRange[] =>
  merges
    .filter(({ top, left }) => top <= rowCount && left <= colCount)
    .map((merge) => ({
      ...merge,
      bottom: Math.min(merge.bottom, rowCount),
      right: Math.min(merge.right, colCount),
    }));

const toGridCell = (
  cell: ExcelJS.Cell,
  row: number,
  col: number,
  merge: GridRange | undefined,
  sheetName: string
): GridCell => {
  const isMergeSlave =
    merge !== undefined && (merge.top !== row || merge.left !== col);
  const base = {
    row,
    col,
    masterRow: merge?.top ?? row,
    masterCol: merge?.left ?? col,
    isMergeSlave,
    ...(merge ? { merge } : {}),
  };
  if (isMergeSlave) {
    return { ...base, text: '', kind: 'empty' };
  }
  const value: unknown = cell.value;
  const kind = kindOf(value);
  // Une erreur (« #REF! ») n'est pas une valeur : la cellule se lit vide, et
  // l'analyse la compte pour le signaler.
  const text =
    kind === 'error'
      ? ''
      : cleanText(cellToString(value).replace(/\r\n?/g, '\n')).trim();
  const formula = formulaOf(cell);
  const refsSheets = formula ? referencedSheets(formula, sheetName) : [];
  return {
    ...base,
    text,
    kind: text === '' && kind !== 'error' ? 'empty' : kind,
    ...(formula ? { formula } : {}),
    ...(refsSheets.length > 0 ? { refsSheets } : {}),
  };
};

export const cellToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    const iso = value.toISOString();
    // Une date sans heure (le cas des tableurs de suivi) se lit AAAA-MM-JJ.
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
  }
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') {
      return value.text;
    }
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => cellToString(part)).join('');
    }
    if ('error' in value && typeof value.error === 'string') {
      return value.error;
    }
    if ('result' in value) {
      return cellToString(value.result);
    }
    return '';
  }
  return String(value);
};

const kindOf = (value: unknown): GridCellKind => {
  if (value instanceof Date) {
    return 'date';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'object' && value !== null) {
    if ('error' in value) {
      return 'error';
    }
    if ('result' in value) {
      return kindOf(value.result);
    }
  }
  return 'text';
};

const formulaOf = (cell: ExcelJS.Cell): string | undefined => {
  if (cell.type !== ExcelJS.ValueType.Formula) {
    return undefined;
  }
  // Une formule partagée n'est écrite qu'une fois : exceljs la recalcule
  // pour chaque cellule qui la partage.
  const formula = cell.formula;
  return typeof formula === 'string' && formula.length > 0
    ? formula.replace(/^=/, '')
    : undefined;
};

// 'Nom avec espaces'!A1 ou Nom!A1 ; une apostrophe doublée en échappe une.
const SHEET_REFERENCE = /(?:'((?:[^']|'')+)'|([\p{L}\p{N}_.]+))!/gu;

export const referencedSheets = (
  formula: string,
  ownSheet: string
): string[] => {
  const names = new Set<string>();
  for (const match of formula.matchAll(SHEET_REFERENCE)) {
    const name = match[1]?.replace(/''/g, "'") ?? match[2];
    if (name && name !== ownSheet) {
      names.add(name);
    }
  }
  return [...names];
};

const toSheetState = (state: string | undefined): SheetState =>
  state === 'hidden' || state === 'veryHidden' ? state : 'visible';

const parseRange = (range: string): GridRange => {
  const [start, end = start] = range.split(':');
  const from = parseAddress(start);
  const to = parseAddress(end);
  return {
    top: Math.min(from.row, to.row),
    left: Math.min(from.col, to.col),
    bottom: Math.max(from.row, to.row),
    right: Math.max(from.col, to.col),
  };
};

const parseAddress = (address: string): { row: number; col: number } => {
  const match = /^\$?([A-Z]+)\$?(\d+)$/i.exec(address.trim());
  if (!match) {
    throw new Error(`Adresse de cellule illisible : ${address}`);
  }
  const col = [...match[1].toUpperCase()].reduce(
    (total, letter) => total * 26 + letter.charCodeAt(0) - 64,
    0
  );
  return { row: Number(match[2]), col };
};

const indexMerges = (merges: GridRange[]): Map<string, GridRange> => {
  const index = new Map<string, GridRange>();
  for (const merge of merges) {
    for (let row = merge.top; row <= merge.bottom; row++) {
      for (let col = merge.left; col <= merge.right; col++) {
        index.set(`${row}:${col}`, merge);
      }
    }
  }
  return index;
};

/**
 * Jusqu'à la dernière valeur, fusions comprises : une mise en forme étendue
 * à toute la feuille ne doit pas la faire déborder.
 */
const contentExtent = (
  worksheet: ExcelJS.Worksheet,
  merges: GridRange[]
): { rowCount: number; colCount: number } => {
  let rowCount = 0;
  let colCount = 0;
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (cellToString(cell.value).trim() !== '') {
        rowCount = Math.max(rowCount, rowNumber);
        colCount = Math.max(colCount, colNumber);
      }
    });
  });
  for (const merge of merges) {
    if (merge.top <= rowCount && merge.left <= colCount) {
      rowCount = Math.max(rowCount, merge.bottom);
      colCount = Math.max(colCount, merge.right);
    }
  }
  return { rowCount, colCount };
};
