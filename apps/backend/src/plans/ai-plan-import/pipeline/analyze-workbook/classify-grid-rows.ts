import { matchHeading } from '../segment-document/heading-patterns';
import { TableHeader } from './detect-table-header';
import {
  collapseSpaces,
  filledCellsOf,
  getCellValue,
  GridCell,
  isBlankGridRow,
  isInWideMerge,
  isVerticalMergeSlave,
  SheetGrid,
} from './sheet-grid';

export type GridRowKind = 'title' | 'header' | 'banner' | 'data' | 'total';

export type ClassifiedRow = {
  row: number;
  kind: GridRowKind;
  /** Le libellé d'un bandeau. */
  text?: string;
};

// Les fonctions qui résument une plage : une rangée qui en porte une est
// une ligne de totaux, pas une fiche.
const AGGREGATE_FORMULA =
  /^(?:SUM|SUMIFS?|COUNT|COUNTA|COUNTIFS?|COUNTBLANK|SUBTOTAL|AVERAGE|AVERAGEIFS?|MAX|MIN)\s*\(/i;
const SAME_SHEET_RANGE =
  /(?<![!\w$])\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)/gi;
const TOTAL_LABEL =
  /^(?:sous[- ]?)?totaux?\b|\btotal\b|^nombre (?:total )?d(?:e |es |['’])/i;
const TOTAL_LABEL_MAX_LENGTH = 80;
// Un montant écrit en texte, comme dans un CSV.
const NUMBER_TEXT = /^[-+]?[\d\s.,]+(?:€|%)?$/;
const BANNER_MAX_LENGTH = 200;
const MAX_ROWS_UNDER_TOTALS = 10;

export type AggregateFormula = {
  row: number;
  col: number;
  formula: string;
  top: number;
  bottom: number;
  /** Colonne de la plage résumée quand elle n'en couvre qu'une. */
  rangeCol: number | null;
  result: string;
};

/**
 * Les formules qui résument une plage verticale au-dessus d'elles, dans le
 * même onglet : `SUM(P6:P434)`, `COUNTIF(H6:H432,"X")`.
 */
export const findAggregateFormulas = (grid: SheetGrid): AggregateFormula[] =>
  grid.cells.flatMap((cells) =>
    cells.flatMap((cell) => {
      if (!cell.formula || !AGGREGATE_FORMULA.test(cell.formula)) {
        return [];
      }
      const ranges = [...cell.formula.matchAll(SAME_SHEET_RANGE)]
        .map((match) => ({
          left: columnNumber(match[1]),
          top: Number(match[2]),
          right: columnNumber(match[3]),
          bottom: Number(match[4]),
        }))
        .filter((range) => range.bottom > range.top && range.bottom < cell.row);
      return ranges.map((range) => ({
        row: cell.row,
        col: cell.col,
        formula: cell.formula ?? '',
        top: range.top,
        bottom: range.bottom,
        rangeCol: range.left === range.right ? range.left : null,
        result: cell.text,
      }));
    })
  );

/**
 * Chaque rangée non vide : titre et en-tête au-dessus du tableau, puis
 * bandeau (une seule cellule, qui regroupe les rangées suivantes), donnée,
 * ou total (formule de synthèse, note sous la dernière, libellé « Total » ou
 * « Nombre de » hors de tout groupe).
 */
export const classifyGridRows = (
  grid: SheetGrid,
  header: TableHeader | null
): ClassifiedRow[] => {
  const aggregates = findAggregateFormulas(grid);
  const aggregateRows = new Set(aggregates.map(({ row }) => row));
  const isBelowSummarizedRows = belowSummarizedRows(grid, aggregates);
  const titleRows = new Set(header?.titleRows ?? []);
  const headerRows = new Set([
    ...(header?.headerRows ?? []),
    ...(header?.noteRows ?? []),
  ]);
  const lastHeaderRow = header?.headerRows.at(-1) ?? 0;

  const classified: ClassifiedRow[] = [];
  grid.cells.forEach((cells, index) => {
    const row = index + 1;
    if (isBlankGridRow(cells)) {
      return;
    }
    if (titleRows.has(row) || (row < lastHeaderRow && !headerRows.has(row))) {
      classified.push({ row, kind: 'title' });
    } else if (headerRows.has(row)) {
      classified.push({ row, kind: 'header' });
    } else if (
      aggregateRows.has(row) ||
      isBelowSummarizedRows(row) ||
      isTotalLabelRow(grid, cells)
    ) {
      classified.push({ row, kind: 'total' });
    } else {
      classified.push({ row, kind: 'data' });
    }
  });
  return markBanners(grid, classified);
};

/**
 * Sous la dernière formule de synthèse, et au plus près d'elle : une note
 * sous les totaux. Une rangée entre la plage résumée et sa formule reste une
 * donnée : ajoutée après coup, la formule ne l'a pas suivie. Un sous-total
 * au milieu de la feuille ne fait pas des rangées suivantes des totaux.
 */
const belowSummarizedRows = (
  grid: SheetGrid,
  aggregates: AggregateFormula[]
): ((row: number) => boolean) => {
  if (aggregates.length === 0) {
    return () => false;
  }
  const lastSummarizedRow = Math.max(...aggregates.map(({ bottom }) => bottom));
  const lastAggregateRow = Math.max(...aggregates.map(({ row }) => row));
  const trailingRows = grid.cells
    .slice(lastAggregateRow)
    .filter((cells) => !isBlankGridRow(cells)).length;
  return (row) =>
    row > lastSummarizedRow &&
    row > lastAggregateRow &&
    trailingRows <= MAX_ROWS_UNDER_TOTALS;
};

const isTotalLabelRow = (grid: SheetGrid, cells: GridCell[]): boolean => {
  if (
    cells.some((cell) => isVerticalMergeSlave(cell) && getCellValue(grid, cell))
  ) {
    return false;
  }
  const texts = cells.filter(
    (cell) =>
      cell.text !== '' &&
      cell.kind !== 'number' &&
      !cell.formula &&
      !NUMBER_TEXT.test(cell.text)
  );
  return (
    texts.length === 1 &&
    texts[0].text.length <= TOTAL_LABEL_MAX_LENGTH &&
    TOTAL_LABEL.test(texts[0].text)
  );
};

/**
 * Une rangée de données d'une seule cellule, hors de tout groupe en cours,
 * qui tient la première colonne, s'étale sur plusieurs colonnes ou se nomme
 * axe ou orientation. Un bandeau unique en tête des données, qui ne se nomme
 * pas ainsi (« Données »), est un titre : il ne regroupe rien.
 */
const markBanners = (
  grid: SheetGrid,
  classified: ClassifiedRow[]
): ClassifiedRow[] => {
  const dataRows = classified.filter(({ kind }) => kind === 'data');
  const usedCols = new Set(
    dataRows.flatMap(({ row }) =>
      filledCellsOf(grid, row).map(({ col }) => col)
    )
  );
  if (usedCols.size <= 1) {
    return classified;
  }
  const firstCol = Math.min(...usedCols);
  const banners = new Map<number, string>();
  for (const { row } of dataRows) {
    const text = bannerText(grid, row, firstCol);
    if (text !== null) {
      banners.set(row, text);
    }
  }
  // Une liste d'une colonne n'a que des rangées d'une cellule : aucune ne
  // s'y détache en bandeau.
  if ((dataRows.length - banners.size) * 2 < banners.size) {
    return classified;
  }
  const [onlyBanner] = banners.keys();
  const firstDataRow = dataRows[0]?.row;
  if (
    banners.size === 1 &&
    onlyBanner === firstDataRow &&
    !isAxisHeading(banners.get(onlyBanner) ?? '')
  ) {
    return classified.map((entry) =>
      entry.row === onlyBanner ? { row: entry.row, kind: 'title' } : entry
    );
  }
  return classified.map((entry) => {
    const text = banners.get(entry.row);
    return text === undefined
      ? entry
      : { row: entry.row, kind: 'banner', text };
  });
};

const bannerText = (
  grid: SheetGrid,
  row: number,
  firstCol: number
): string | null => {
  const cells = grid.cells[row - 1] ?? [];
  if (
    cells.some((cell) => isVerticalMergeSlave(cell) && getCellValue(grid, cell))
  ) {
    return null;
  }
  const own = filledCellsOf(grid, row);
  if (own.length !== 1) {
    return null;
  }
  const [cell] = own;
  const text = collapseSpaces(cell.text);
  if (
    cell.kind === 'number' ||
    cell.formula !== undefined ||
    text.length > BANNER_MAX_LENGTH
  ) {
    return null;
  }
  return cell.col === firstCol || isInWideMerge(cell) || isAxisHeading(text)
    ? text
    : null;
};

export const isAxisHeading = (text: string): boolean => {
  const heading = matchHeading(text.replace(/\s+/g, ' '));
  return heading?.kind === 'axe' || heading?.kind === 'orientation';
};

const columnNumber = (letters: string): number =>
  [...letters.toUpperCase()].reduce(
    (total, letter) => total * 26 + letter.charCodeAt(0) - 64,
    0
  );
