import { isKnownStatutLabel } from './map-tabular-statut';
import { matchColumnLabel } from './match-column-label';
import {
  collapseSpaces,
  filledCellsOf,
  getCellValueAt,
  getGridCell,
  GridCell,
  isInWideMerge,
  isVerticalMergeSlave,
  nonBlankRows,
  SheetGrid,
} from './sheet-grid';

export type TableHeader = {
  /** Rangées non vides au-dessus de l'en-tête : titre du tableau, bandeau. */
  titleRows: number[];
  /** Une ou deux rangées. */
  headerRows: number[];
  /**
   * Rangées de consignes sous l'en-tête (« Champ texte », « Champ date ») :
   * ni libellé, ni donnée.
   */
  noteRows: number[];
  /** Un libellé par colonne (`labels[col - 1]`), vide sans libellé. */
  labels: string[];
};

const HEADER_SEARCH_ROWS = 20;
// Une rangée d'en-tête nomme au moins la moitié des colonnes utilisées.
const HEADER_MIN_COVERAGE = 0.5;
const HEADER_MAX_AVERAGE_LENGTH = 60;
const HEADER_MAX_NUMERIC_SHARE = 0.5;
const SUB_HEADER_MAX_LENGTH = 40;
const MAX_NOTE_ROWS = 2;
const NOTE_MIN_CELLS = 4;
const NOTE_MAX_DISTINCT_SHARE = 0.5;
// Un en-tête tient sur deux rangées au plus : une fusion plus haute qui en
// part regroupe des données.
const HEADER_MAX_MERGE_HEIGHT = 2;

/**
 * Les rangées de titre au-dessus du tableau, puis son en-tête : la première
 * rangée large, faite de libellés courts, et la suivante quand elle détaille
 * ses cellules fusionnées en largeur (« CALENDRIER » sur 2021, 2022…).
 */
export const detectTableHeader = (grid: SheetGrid): TableHeader | null => {
  const rows = nonBlankRows(grid);
  const usedCols = countUsedColumns(grid);
  const minCoverage = Math.max(2, Math.ceil(usedCols * HEADER_MIN_COVERAGE));
  const top = rows
    .slice(0, HEADER_SEARCH_ROWS)
    .find((row) => isHeaderRow(grid, row, minCoverage));
  if (top === undefined) {
    return null;
  }
  const headerRows = isSubHeaderRow(grid, top, top + 1)
    ? [top, top + 1]
    : [top];
  const noteRows: number[] = [];
  for (const row of rows.filter(
    (candidate) => candidate > headerRows[headerRows.length - 1]
  )) {
    if (noteRows.length >= MAX_NOTE_ROWS || !isNoteRow(grid, row)) {
      break;
    }
    noteRows.push(row);
  }
  return {
    titleRows: rows.filter((row) => row < top),
    headerRows,
    noteRows,
    labels: composeHeaderLabels(grid, headerRows),
  };
};

/**
 * La même consigne répétée sous la plupart des colonnes : une rangée de
 * données ne répète pas une valeur d'une colonne à l'autre.
 */
const isNoteRow = (grid: SheetGrid, row: number): boolean => {
  const own = filledCellsOf(grid, row);
  if (
    own.length < NOTE_MIN_CELLS ||
    own.some((cell) => cell.kind !== 'text' || cell.formula)
  ) {
    return false;
  }
  const firstLines = own.map((cell) => cell.text.split('\n')[0].trim());
  return new Set(firstLines).size / own.length <= NOTE_MAX_DISTINCT_SHARE;
};

/** « CALENDRIER · 2021 » : le libellé du dessus, puis son détail. */
export const composeHeaderLabels = (
  grid: SheetGrid,
  headerRows: number[]
): string[] => {
  const [top, bottom] = headerRows;
  return Array.from({ length: grid.colCount }, (_, index) => {
    const col = index + 1;
    const upper = getCellValueAt(grid, top, col);
    const lower =
      bottom === undefined ? undefined : getGridCell(grid, bottom, col);
    const detail = lower && !lower.isMergeSlave ? lower.text : '';
    return collapseSpaces(
      [...new Set([upper, detail])].filter((label) => label !== '').join(' · ')
    );
  });
};

const countUsedColumns = (grid: SheetGrid): number => {
  const used = new Set<number>();
  for (const cells of grid.cells) {
    for (const cell of cells) {
      if (cell.text !== '') {
        used.add(cell.col);
      }
    }
  }
  return used.size;
};

/**
 * Une rangée large de libellés courts. Une rangée prise dans une fusion de
 * données (une cellule qui en prolonge une du dessus, ou qui descend plus bas
 * qu'un en-tête), ou qui écrit un statut parmi des textes que le synonymier
 * ne reconnaît pas, est une donnée : une feuille sans en-tête n'en a pas.
 */
const isHeaderRow = (
  grid: SheetGrid,
  row: number,
  minCoverage: number
): boolean => {
  const cells = grid.cells[row - 1] ?? [];
  const own = filledCellsOf(grid, row);
  if (
    own.length < 2 ||
    cells.some(
      (cell) =>
        isVerticalMergeSlave(cell) ||
        (cell.merge !== undefined &&
          cell.merge.top === row &&
          cell.merge.bottom - cell.merge.top >= HEADER_MAX_MERGE_HEIGHT)
    ) ||
    writesStatut(own)
  ) {
    return false;
  }
  const covered = cells.filter(
    (cell) => getCellValueAt(grid, row, cell.col) !== ''
  ).length;
  const numeric = own.filter((cell) => cell.kind === 'number').length;
  const averageLength =
    own.reduce((total, cell) => total + cell.text.length, 0) / own.length;
  return (
    covered >= minCoverage &&
    numeric / own.length < HEADER_MAX_NUMERIC_SHARE &&
    averageLength <= HEADER_MAX_AVERAGE_LENGTH
  );
};

const writesStatut = (cells: GridCell[]): boolean =>
  cells.some((cell) => isKnownStatutLabel(cell.text)) &&
  cells.filter((cell) => matchColumnLabel(cell.text) !== null).length * 2 <
    cells.length;

/**
 * Une seconde rangée d'en-tête ne remplit que le dessous d'une fusion en
 * largeur, ou d'une case sans libellé, et par des libellés courts : une
 * rangée de données remplit le dessous des libellés.
 */
const isSubHeaderRow = (
  grid: SheetGrid,
  top: number,
  next: number
): boolean => {
  const own = filledCellsOf(grid, next);
  if (own.length === 0) {
    return false;
  }
  let underWideMerge = 0;
  for (const cell of own) {
    if (cell.text.length > SUB_HEADER_MAX_LENGTH || cell.formula) {
      return false;
    }
    const above = getGridCell(grid, top, cell.col);
    if (
      isInWideMerge(above) &&
      above?.merge?.top === top &&
      above.merge.bottom === top
    ) {
      underWideMerge += 1;
    } else if (getCellValueAt(grid, top, cell.col) !== '') {
      return false;
    }
  }
  return underWideMerge > 0;
};
