/** Rectangle de cellules, bornes comprises, en numéros d'origine (à partir de 1). */
export type GridRange = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

export type GridCellKind =
  | 'empty'
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'error';

export type GridCell = {
  /**
   * Texte nettoyé de la cellule, retours à la ligne compris. Vide pour une
   * esclave de fusion : sa valeur est celle de son maître.
   */
  text: string;
  /** Nature de la valeur, ou du résultat en cache d'une formule. */
  kind: GridCellKind;
  /** Ligne et colonne d'origine dans la feuille, à partir de 1. */
  row: number;
  col: number;
  /** La cellule elle-même hors fusion, le coin haut gauche de sa fusion sinon. */
  masterRow: number;
  masterCol: number;
  isMergeSlave: boolean;
  merge?: GridRange;
  /** Sans « = » ; `text` porte alors le résultat gardé en cache par le tableur. */
  formula?: string;
  /** Les autres onglets cités par la formule. */
  refsSheets?: string[];
};

export type SheetState = 'visible' | 'hidden' | 'veryHidden';

/**
 * Une feuille telle que le tableur la montre : rectangulaire, de la cellule A1
 * à la dernière ligne et la dernière colonne qui portent une valeur.
 */
export type SheetGrid = {
  /** Nom de l'onglet ; vide pour un CSV. */
  name: string;
  state: SheetState;
  /** `cells[r][c]` est la cellule de la ligne r + 1, colonne c + 1. */
  cells: GridCell[][];
  rowCount: number;
  colCount: number;
  merges: GridRange[];
  /** Étendue réelle de l'onglet, quand elle dépasse ce que la grille retient. */
  truncatedFrom?: { rowCount: number; colCount: number };
};

export const getGridCell = (
  grid: SheetGrid,
  row: number,
  col: number
): GridCell | undefined => grid.cells[row - 1]?.[col - 1];

/** Le texte que la cellule affiche : celui de son maître pour une esclave de fusion. */
export const getCellValue = (grid: SheetGrid, cell: GridCell): string =>
  cell.isMergeSlave
    ? getGridCell(grid, cell.masterRow, cell.masterCol)?.text ?? ''
    : cell.text;

/** Le texte affiché à cette position, vide hors de la feuille. */
export const getCellValueAt = (
  grid: SheetGrid,
  row: number,
  col: number
): string => {
  const cell = getGridCell(grid, row, col);
  return cell ? getCellValue(grid, cell) : '';
};

/** Pour les avertissements : un CSV n'a pas de nom d'onglet. */
export const sheetLabel = (name: string): string =>
  name === '' ? 'Le fichier CSV' : `Onglet « ${name} »`;

/** « A », « B »… « AA » : la colonne telle que le tableur la nomme. */
export const columnLetter = (col: number): string => {
  let letters = '';
  for (let rest = col; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    letters = String.fromCharCode(65 + ((rest - 1) % 26)) + letters;
  }
  return letters;
};

export const isVerticalMergeSlave = (cell: GridCell): boolean =>
  cell.isMergeSlave && cell.masterRow < cell.row;

/** Une cellule d'une fusion sur plusieurs rangées. */
export const isInVerticalMerge = (cell: GridCell | undefined): boolean =>
  cell?.merge !== undefined && cell.merge.bottom > cell.merge.top;

/** Une cellule d'une fusion sur plusieurs colonnes. */
export const isInWideMerge = (cell: GridCell | undefined): boolean =>
  cell?.merge !== undefined && cell.merge.right > cell.merge.left;

export const isBlankGridRow = (row: GridCell[]): boolean =>
  row.every((cell) => cell.text === '');

/** Les cellules qui portent leur propre valeur : une fusion compte une fois. */
export const filledCells = (cells: GridCell[]): GridCell[] =>
  cells.filter((cell) => cell.text !== '');

/** Les cellules non vides d'une rangée, numérotée à partir de 1. */
export const filledCellsOf = (grid: SheetGrid, row: number): GridCell[] =>
  filledCells(grid.cells[row - 1] ?? []);

/** Les numéros des rangées non vides. */
export const nonBlankRows = (grid: SheetGrid): number[] =>
  grid.cells.flatMap((cells, index) =>
    isBlankGridRow(cells) ? [] : [index + 1]
  );

export const collapseSpaces = (text: string): string =>
  text.replace(/\s+/g, ' ').trim();

/**
 * Une rangée sur une ligne, cellules séparées par une tabulation. Une
 * esclave de fusion est vide : la valeur n'est écrite qu'une fois, sur la
 * rangée de son maître.
 */
export const renderGridRow = (row: GridCell[]): string =>
  row
    .map((cell) => cell.text.replace(/\s*[\n\t]\s*/g, ' '))
    .join('\t')
    .trimEnd();

/** Les rangées non vides de la feuille, avec leur numéro d'origine. */
export const renderGridLines = (
  grid: SheetGrid
): { row: number; text: string }[] =>
  grid.cells.flatMap((cells, index) =>
    isBlankGridRow(cells)
      ? []
      : [{ row: index + 1, text: renderGridRow(cells) }]
  );

/** Grille d'un tableau de textes, sans fusion : un CSV. */
export const buildTextGrid = (
  name: string,
  rows: string[][],
  kindOf: (text: string) => GridCellKind = (text) =>
    text === '' ? 'empty' : 'text'
): SheetGrid => {
  const lastRow = rows.findLastIndex((row) => row.some((text) => text !== ''));
  const kept = rows.slice(0, lastRow + 1);
  const colCount = Math.max(
    0,
    ...kept.map((row) => row.findLastIndex((text) => text !== '') + 1)
  );
  return {
    name,
    state: 'visible',
    rowCount: kept.length,
    colCount,
    merges: [],
    cells: kept.map((row, rowIndex) =>
      Array.from({ length: colCount }, (_, colIndex) => {
        const text = row[colIndex] ?? '';
        return {
          text,
          kind: kindOf(text),
          row: rowIndex + 1,
          col: colIndex + 1,
          masterRow: rowIndex + 1,
          masterCol: colIndex + 1,
          isMergeSlave: false,
        };
      })
    ),
  };
};
