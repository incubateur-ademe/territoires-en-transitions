import { estimateTokenCount } from '@tet/backend/utils/llm/estimate-token-count';
import { classifyGridRows } from '../analyze-workbook/classify-grid-rows';
import {
  composeHeaderLabels,
  detectTableHeader,
} from '../analyze-workbook/detect-table-header';
import {
  ColumnBlock,
  readColumnBlocks,
  splitSegments,
} from '../analyze-workbook/profile-columns';
import {
  collapseSpaces,
  filledCellsOf,
  getCellValue,
  getCellValueAt,
  isVerticalMergeSlave,
  renderGridRow,
  SheetGrid,
} from '../analyze-workbook/sheet-grid';
import { DocumentPage } from '../document/document-page';
import { buildUnit, DocumentUnit, UnitLine } from './document-unit';

// Une colonne de regroupement ne réemploie presque jamais une valeur d'un bloc
// à l'autre, au contraire d'un statut ou d'une croix de calendrier.
const GROUPING_MIN_DISTINCT_RATIO = 0.8;
const GROUPING_MIN_FILL_RATIO = 0.5;

/**
 * Un onglet de tableur en unités que le modèle lit d'un coup, l'en-tête du
 * tableau en tête de chacune. Avec sa grille, l'onglet est coupé entre deux
 * groupes de rangées (une fiche et ses sous-actions) ou à un bandeau, lus
 * comme l'analyse du classeur les lit ; une page sans grille (construite à
 * la main) est coupée au volume, entre deux lignes.
 */
export const cutTabularUnits = (
  page: DocumentPage,
  maxTokens: number,
  grid?: SheetGrid
): DocumentUnit[] =>
  grid ? cutGridUnits(page, grid, maxTokens) : cutLineUnits(page, maxTokens);

/**
 * Une fiche s'étend sur plusieurs rangées fusionnées : le modèle peut la
 * rendre deux fois, une par extrait qui en contient une partie.
 */
export const hasMergedRowGroups = (grids: SheetGrid[]): boolean =>
  grids.some((grid) => readTableLayout(grid).finestGrouping?.merged === true);

type GroupingColumn = {
  col: number;
  merged: boolean;
  /** Le bloc de chaque rangée : deux rangées du même bloc restent ensemble. */
  blockOf: Map<number, number>;
};

type TableLayout = {
  titleRows: number[];
  headerRows: number[];
  /** Les rangées sous l'en-tête : données, bandeaux et totaux. */
  bodyRows: number[];
  bannerRows: Set<number>;
  finestGrouping: GroupingColumn | null;
};

const readTableLayout = (grid: SheetGrid): TableLayout => {
  const header = detectTableHeader(grid);
  const rows = classifyGridRows(grid, header);
  const headerRows = [
    ...(header?.headerRows ?? []),
    ...(header?.noteRows ?? []),
  ];
  const lastHeaderRow = headerRows.at(-1) ?? 0;
  return {
    titleRows: header?.titleRows ?? [],
    headerRows: header?.headerRows ?? [],
    bodyRows: rows
      .filter(({ row }) => row > lastHeaderRow)
      .map(({ row }) => row),
    bannerRows: new Set(
      rows.filter(({ kind }) => kind === 'banner').map(({ row }) => row)
    ),
    finestGrouping: findFinestGrouping(grid, splitSegments(rows)),
  };
};

/**
 * La colonne dont la valeur couvre plusieurs rangées, fusionnées ou répétées,
 * avec le plus de blocs : en général la fiche, dont les sous-actions occupent
 * une rangée chacune.
 */
const findFinestGrouping = (
  grid: SheetGrid,
  segments: number[][]
): GroupingColumn | null => {
  const dataRows = segments.flat().length;
  const valueAt = (row: number, col: number) => getCellValueAt(grid, row, col);
  let finest: { column: GroupingColumn; blocks: number } | null = null;
  for (let col = 1; col <= grid.colCount; col++) {
    const blocks = readColumnBlocks(grid, segments, col, valueAt);
    const filled = blocks.reduce((total, { rows }) => total + rows.length, 0);
    const isGrouping =
      blocks.some(({ rows }) => rows.length > 1) &&
      blocks.length < filled &&
      filled >= dataRows * GROUPING_MIN_FILL_RATIO &&
      new Set(blocks.map(({ value }) => value)).size >=
        blocks.length * GROUPING_MIN_DISTINCT_RATIO;
    if (isGrouping && (finest === null || blocks.length >= finest.blocks)) {
      finest = {
        blocks: blocks.length,
        column: {
          col,
          merged: blocks.some(({ rows, merged }) => merged && rows.length > 1),
          blockOf: indexBlocks(blocks),
        },
      };
    }
  }
  return finest?.column ?? null;
};

const indexBlocks = (blocks: ColumnBlock[]): Map<number, number> =>
  new Map(blocks.flatMap(({ rows }, index) => rows.map((row) => [row, index])));

type Segment = { kind: 'banner' | 'group'; rows: number[] };

const segmentRows = (layout: TableLayout): Segment[] => {
  const segments: Segment[] = [];
  let previousKey: number | null = null;
  for (const row of layout.bodyRows) {
    if (layout.bannerRows.has(row)) {
      segments.push({ kind: 'banner', rows: [row] });
      previousKey = null;
      continue;
    }
    const key = layout.finestGrouping?.blockOf.get(row) ?? null;
    const current = segments.at(-1);
    // Une rangée sans valeur dans la colonne de regroupement (totaux,
    // compléments) reste avec le groupe qui la précède.
    const continuesGroup =
      current?.kind === 'group' &&
      layout.finestGrouping !== null &&
      (key === null || key === previousKey);
    if (continuesGroup) {
      current.rows.push(row);
    } else {
      segments.push({ kind: 'group', rows: [row] });
    }
    previousKey = key ?? previousKey;
  }
  return segments;
};

const cutGridUnits = (
  page: DocumentPage,
  grid: SheetGrid,
  maxTokens: number
): DocumentUnit[] => {
  const layout = readTableLayout(grid);
  if (layout.bodyRows.length === 0) {
    return [];
  }
  const toLine = (text: string): UnitLine => ({ text, pageIndex: page.index });
  const rowLine = (row: number) =>
    toLine(renderGridRow(grid.cells[row - 1] ?? []));
  const headerLines =
    layout.headerRows.length > 0
      ? [toLine(renderHeader(grid, layout.headerRows))]
      : [];
  const titleLines = layout.titleRows.map(rowLine);
  const headerTokens = headerLines.reduce(
    (total, { text }) => total + estimateTokenCount(text) + 1,
    0
  );
  const tokensOf = (row: number) => estimateTokenCount(rowLine(row).text) + 1;

  const units: DocumentUnit[] = [];
  let banner: string | undefined;
  let body: number[] = [];
  let bodyTokens = 0;
  let continued = false;

  const hasContent = () => body.some((row) => !layout.bannerRows.has(row));
  const push = (row: number) => {
    body.push(row);
    bodyTokens += tokensOf(row);
  };
  const flush = () => {
    if (hasContent()) {
      const suite = renderSuiteDe(grid, body[0]);
      units.push(
        buildUnit(
          [
            ...(units.length === 0 ? titleLines : []),
            ...headerLines,
            ...(suite ? [toLine(suite)] : []),
            ...body.map(rowLine),
          ],
          [...(page.label ? [page.label] : []), ...(banner ? [banner] : [])],
          'table',
          { continued }
        )
      );
    }
    body = [];
    bodyTokens = 0;
    continued = false;
  };

  for (const segment of segmentRows(layout)) {
    if (segment.kind === 'banner') {
      if (hasContent()) {
        flush();
      }
      banner = collapseSpaces(filledCellsOf(grid, segment.rows[0])[0].text);
      push(segment.rows[0]);
      continue;
    }
    const groupTokens = segment.rows.reduce(
      (total, row) => total + tokensOf(row),
      0
    );
    if (hasContent() && headerTokens + bodyTokens + groupTokens > maxTokens) {
      flush();
    }
    for (const row of segment.rows) {
      if (
        hasContent() &&
        headerTokens + bodyTokens + tokensOf(row) > maxTokens
      ) {
        flush();
        continued = true;
      }
      push(row);
    }
  }
  flush();
  return units;
};

/** Un libellé par colonne, composé sur deux rangées : « CALENDRIER · 2021 ». */
const renderHeader = (grid: SheetGrid, headerRows: number[]): string =>
  composeHeaderLabels(grid, headerRows).join('\t').trimEnd();

/**
 * Les valeurs fusionnées depuis une rangée antérieure, rendues vides dans
 * l'extrait : sans elles, le modèle ne saurait pas à quel groupe la suite
 * appartient.
 */
const renderSuiteDe = (grid: SheetGrid, row: number): string | null => {
  const values: string[] = [];
  for (const cell of grid.cells[row - 1] ?? []) {
    const value = isVerticalMergeSlave(cell) ? getCellValue(grid, cell) : '';
    if (value !== '' && values.at(-1) !== value) {
      values.push(value.replace(/\s*[\n\t]\s*/g, ' '));
    }
  }
  return values.length > 0 ? `[Suite de : ${values.join(' > ')}]` : null;
};

/** Sans grille : la première ligne pour en-tête, coupe au volume. */
const cutLineUnits = (
  page: DocumentPage,
  maxTokens: number
): DocumentUnit[] => {
  const [header, ...rows] = page.lines.map(
    (line): UnitLine => ({ text: line.text, pageIndex: page.index })
  );
  if (!header) {
    return [];
  }
  const headingPath = page.label ? [page.label] : [];
  const headerTokens = estimateTokenCount(header.text) + 1;
  const units: DocumentUnit[] = [];
  let current: UnitLine[] = [];
  let tokens = headerTokens;
  for (const row of rows) {
    const rowTokens = estimateTokenCount(row.text) + 1;
    if (current.length > 0 && tokens + rowTokens > maxTokens) {
      units.push(buildUnit([header, ...current], headingPath, 'table'));
      current = [];
      tokens = headerTokens;
    }
    current.push(row);
    tokens += rowTokens;
  }
  if (current.length > 0) {
    units.push(buildUnit([header, ...current], headingPath, 'table'));
  }
  return units;
};
