import { matchColumnLabel } from '../analyze-workbook/match-column-label';
import { DocumentLink, PageLine } from '../document/document-page';
import {
  groupRows,
  linesFromPositionedItems,
  PositionedItem,
  toPageLine,
} from './reconstruct-page-lines';

/** Ce qu'un tableau transmet à sa suite, page suivante. */
export type ColumnTableContext = {
  /** Étendue horizontale de chaque colonne. */
  ranges: { left: number; right: number }[];
  /** Libellé d'en-tête de chaque colonne, vide sans libellé. */
  labels: string[];
  /** La colonne dont chaque cellule est une rangée du tableau. */
  mainIndex: number;
  /** Dernière cellule lue de chaque colonne de regroupement. */
  groupTexts: string[];
  /** Ses rangées sont numérotées : sa suite doit l'être aussi. */
  numbered: boolean;
};

/** Une ligne de cellule, avec son étendue : où elle s'arrête dit si elle passe à la ligne. */
type CellLine = PageLine & { left: number; right: number };

type Cell = {
  text: string;
  top: number;
  bottom: number;
  fontSize: number;
  lineCount: number;
  lines: CellLine[];
};

type Column = {
  left: number;
  right: number;
  cells: Cell[];
  /** Ses lignes sont centrées, comme le texte d'une carte ou d'un encadré. */
  centered: boolean;
};

// Deux colonnes suffisent à chercher : ce sont peut-être deux cartes.
const MIN_COLUMNS = 2;
// Un tableau à en-tête a au moins trois colonnes : deux sont le plus souvent
// un libellé et sa valeur.
const MIN_TABLE_COLUMNS = 3;
const MIN_GUTTER_SUPPORT = 3;
const MIN_MULTI_COLUMN_ROWS = 4;
// Deux morceaux d'une même ligne physique appartiennent à deux colonnes
// quand une hauteur de police et demie les sépare : cinq fois une espace.
const COLUMN_GAP_RATIO = 1.5;
// Une colonne fait au moins six hauteurs de police : en deçà, c'est la puce
// d'une liste, détachée de son texte.
const MIN_COLUMN_WIDTH_RATIO = 6;
const MIN_GUTTER_WIDTH = 5;
// Dans une cellule, l'interligne vaut 1,1 à 1,4 fois la police.
const CELL_GAP_RATIO = 1.6;
// Une ligne isolée rejoint le tableau si elle le touche presque.
const REGION_EXTENSION_RATIO = 2;
const SPANNING_OVERLAP = 5;
const MAX_SPANNING_SHARE = 0.15;
const HEADER_BAND_RATIO = 3;
const HEADER_MAX_LENGTH = 40;
const HEADER_MAX_WORDS = 3;
const HEADER_MAX_LINES = 3;
const MIN_HEADER_LABELS = 2;
const MAX_PAGE_BANNER_ROWS = 2;
// Laisser une rangée sans cellule coûte une fraction de l'écart entre deux
// rangées : plus qu'un centrage approximatif (une cellule fusionnée sur une
// page entière tombe à quelques points de son milieu), moins que d'étirer une
// cellule jusqu'à une rangée voisine qui n'en a pas.
const UNASSIGNED_ROW_PITCH_SHARE = 0.35;
const DEFAULT_ROW_PITCH = 30;
const ROW_ALIGNMENT_RATIO = 0.5;
// Une ligne passe à la ligne quand son mot suivant n'y tient plus : la
// largeur d'un caractère, rapportée à la ligne, est approximative, et le bord
// connu de la colonne n'est pas celui de sa cellule.
const WRAP_TOLERANCE_RATIO = 2;
const CARD_MIN_CELLS = 2;
const CARD_MAX_CELL_GAP = 3;
// Un texte centré n'occupe pas toute la largeur de sa carte.
const CARD_MAX_WIDTH_RATIO = 2.2;
const CARD_MIN_WIDTH_RATIO = 8;
const CARD_MIN_MEAN_LENGTH = 25;
const CARD_TITLE_MAX_LENGTH = 140;
const CARD_TITLE_MAX_LINES = 5;
const TWO_CARDS_MIN_CELLS = 3;
const CENTERED_MIN_LINES = 3;
const CENTERED_TOLERANCE_RATIO = 1.5;
const CENTERED_SHARE = 0.8;

/**
 * Relit une page faite d'un tableau à colonnes, ou de cartes côte à côte,
 * colonne par colonne : lue ligne par ligne, elle mêle sur une même ligne la
 * fin d'un objectif, le début d'une action et le nom d'un organisme.
 *
 * Un tableau à en-tête (« Enjeux | Objectifs | Actions | Portage ») sort
 * rangée par rangée : le regroupement de gauche en titre, la cellule de la
 * colonne principale sur une ligne (en titre de fiche si les rangées sont
 * numérotées), puis « Libellé : valeur » pour chaque colonne de droite. Sans
 * en-tête reconnu, chaque colonne est lue en entier, l'une après l'autre.
 * `null` : la page n'a pas cette forme.
 */
export const readColumnTable = (
  positioned: PositionedItem[],
  previous: ColumnTableContext | null
): { lines: PageLine[]; context: ColumnTableContext | null } | null => {
  // pdf.js rend aussi des fragments faits d'espaces seuls, souvent posés
  // dans les gouttières : ils masqueraient les colonnes.
  const rows = groupRows(
    positioned
      .filter((item) => item.text.trim() !== '')
      .sort((a, b) => a.y - b.y || a.x - b.x)
  );
  const continued = previous ? continueTable(rows, previous) : null;
  const found = continued ?? findTable(rows);
  if (found === null) {
    return null;
  }
  const { ranges, first, last } = found;
  const columnIndexOf = columnOf(ranges);
  const isSpanning = spansColumns(ranges);
  const region = rows.slice(first, last + 1);
  const spanningRows = region.filter((row) => row.some(isSpanning));
  if (
    continued === null &&
    spanningRows.length > region.length * MAX_SPANNING_SHARE
  ) {
    return null;
  }

  const columns: Column[] = ranges.map((range, index) => {
    const lines = groupRows(
      region
        .filter((row) => !row.some(isSpanning))
        .flat()
        .filter((item) => columnIndexOf(item) === index)
        .sort((a, b) => a.y - b.y || a.x - b.x)
    );
    return {
      ...range,
      cells: toCells(
        lines.map((row) => ({
          ...toPageLine(row),
          left: row[0].x,
          right: Math.max(...row.map((item) => item.right)),
        }))
      ),
      centered: areCentered(lines),
    };
  });

  const header = readHeader(columns);
  const sameTable =
    previous !== null &&
    (continued !== null || sameColumns(previous.ranges, ranges));
  const labels = header?.labels ?? (sameTable ? previous.labels : null);
  const body = header ? header.columns : columns;

  const before = linesFromPositionedItems(rows.slice(0, first).flat());
  const after = linesFromPositionedItems(rows.slice(last + 1).flat());
  const spanning = spanningRows.map((row) => toPageLine(row));

  if (labels === null) {
    return areSideBySideCards(body)
      ? {
          lines: [
            ...before,
            ...spanning,
            ...readColumnByColumn(body),
            ...after,
          ],
          context: null,
        }
      : null;
  }
  const mainIndex =
    header === null && sameTable
      ? previous.mainIndex
      : mainColumnOf(labels, body);
  const table = readRowByRow({
    columns: body,
    labels,
    mainIndex,
    groupTexts: sameTable ? previous.groupTexts : [],
  });
  return {
    lines: [...before, ...placeByY([...table.lines, ...spanning]), ...after],
    context: {
      // Un texte centré ne touche pas toujours les bords de sa colonne :
      // d'une page à l'autre, la colonne garde sa plus grande étendue.
      ranges: ranges.map((range, index) => {
        const known = sameTable ? previous.ranges[index] : range;
        return {
          left: Math.min(known.left, range.left),
          right: Math.max(known.right, range.right),
        };
      }),
      labels,
      mainIndex,
      groupTexts: table.groupTexts,
      numbered: table.numbered,
    },
  };
};

type Range = { left: number; right: number };
type TableRegion = { ranges: Range[]; first: number; last: number };

const overlapOf = (item: PositionedItem, range: Range): number =>
  Math.min(item.right, range.right) - Math.max(item.x, range.left);

/** La colonne que le fragment recouvre le plus, à défaut la plus proche. */
const columnOf =
  (ranges: Range[]) =>
  (item: PositionedItem): number =>
    ranges.reduce(
      (best, range, index) =>
        overlapOf(item, range) > overlapOf(item, ranges[best]) ? index : best,
      0
    );

/** Un titre ou une phrase qui court sur plusieurs colonnes. */
const spansColumns =
  (ranges: Range[]) =>
  (item: PositionedItem): boolean =>
    ranges.filter((range) => overlapOf(item, range) > SPANNING_OVERLAP).length >
    1;

const fitsOneColumn = (ranges: Range[]) => {
  const isSpanning = spansColumns(ranges);
  // Un mot d'une ligne justifiée déborde parfois dans la gouttière : il
  // reste à sa colonne tant qu'il la touche presque.
  return (row: PositionedItem[]): boolean =>
    row.every(
      (item) =>
        !isSpanning(item) &&
        ranges.some((range) => overlapOf(item, range) > -item.fontSize)
    );
};

/**
 * Les colonnes d'une page : séparées par des gouttières que plusieurs lignes
 * partagent. Le blanc large d'une ligne de prose justifiée, seul à sa place,
 * n'en est pas une.
 */
const findTable = (rows: PositionedItem[][]): TableRegion | null => {
  const gapsOfRow = rows.map(gapsOf);
  if (
    gapsOfRow.filter((gaps) => gaps.length > 0).length < MIN_MULTI_COLUMN_ROWS
  ) {
    return null;
  }
  const gutters = sharedGutters(
    gapsOfRow.flatMap((gaps) =>
      gaps.map((gap) => ({
        ...gap,
        // Une ligne à trois morceaux ou plus est une rangée de tableau : ses
        // blancs comptent d'emblée. Un blanc isolé doit se répéter.
        weight: gaps.length >= 2 ? MIN_GUTTER_SUPPORT : 1,
      }))
    )
  );
  if (gutters.length < MIN_COLUMNS - 1) {
    return null;
  }
  const crossesGutter = (gaps: Range[]) =>
    gaps.some((gap) =>
      gutters.some(
        (gutter) => gap.left < gutter.right && gap.right > gutter.left
      )
    );
  const straddlesOne = (borders: number[]) => (item: PositionedItem) =>
    borders.some(
      (border) =>
        item.x < border - SPANNING_OVERLAP &&
        item.right > border + SPANNING_OVERLAP
    );
  const voted = gutters.map((gutter) => (gutter.left + gutter.right) / 2);
  // Une ligne de prose coupée par un blanc, au-dessus du tableau, traverse
  // aussi une gouttière : elle n'en ouvre pas la zone.
  const isTableRow = (row: PositionedItem[], index: number) =>
    crossesGutter(gapsOfRow[index]) && !row.some(straddlesOne(voted));
  let first = rows.findIndex(isTableRow);
  let last = rows.findLastIndex(isTableRow);
  if (first === -1) {
    return null;
  }
  const borders = withEmptyStrips(
    rows
      .slice(first, last + 1)
      .flat()
      .filter((item) => !straddlesOne(voted)(item)),
    voted
  );
  const columnIndexOf = (item: PositionedItem) =>
    borders.filter((border) => (item.x + item.right) / 2 > border).length;
  const straddles = straddlesOne(borders);
  const items = rows
    .slice(first, last + 1)
    .flat()
    .filter((item) => !straddles(item));
  const ranges = Array.from({ length: borders.length + 1 }, (_, index) => {
    const own = items.filter((item) => columnIndexOf(item) === index);
    return {
      left: Math.min(...own.map((item) => item.x)),
      right: Math.max(...own.map((item) => item.right)),
    };
  });
  if (ranges.some((range) => !Number.isFinite(range.left))) {
    return null;
  }
  const fits = fitsOneColumn(ranges);
  const yOf = (row: PositionedItem[]) => row[0].y;
  const reach = (row: PositionedItem[]) =>
    REGION_EXTENSION_RATIO * row[0].fontSize;
  while (
    first > 0 &&
    fits(rows[first - 1]) &&
    yOf(rows[first]) - yOf(rows[first - 1]) <= reach(rows[first])
  ) {
    first--;
  }
  while (
    last < rows.length - 1 &&
    fits(rows[last + 1]) &&
    yOf(rows[last + 1]) - yOf(rows[last]) <= reach(rows[last])
  ) {
    last++;
  }
  return { ranges, first, last };
};

/**
 * Des cartes décalées en hauteur ne partagent aucune ligne : leur gouttière
 * n'est le blanc d'aucune. Elle reste une bande que nul texte ne traverse, à
 * distance des gouttières déjà trouvées et des bords.
 */
const withEmptyStrips = (
  items: PositionedItem[],
  borders: number[]
): number[] => {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  if (sorted.length === 0) {
    return borders;
  }
  const minWidth =
    MIN_COLUMN_WIDTH_RATIO *
    sorted.map((item) => item.fontSize).sort((a, b) => a - b)[
      Math.floor(sorted.length / 2)
    ];
  const strips: number[] = [];
  let reach = sorted[0].right;
  for (const item of sorted) {
    if (item.x - reach >= MIN_GUTTER_WIDTH) {
      strips.push((reach + item.x) / 2);
    }
    reach = Math.max(reach, item.right);
  }
  const accepted = [...borders];
  for (const strip of strips) {
    if (
      [sorted[0].x, ...accepted, reach].every(
        (edge) => Math.abs(edge - strip) >= minWidth
      )
    ) {
      accepted.push(strip);
    }
  }
  return accepted.sort((a, b) => a - b);
};

/** Les blancs d'une ligne assez larges pour séparer deux colonnes. */
const gapsOf = (row: PositionedItem[]): Range[] =>
  row.flatMap((item, index) =>
    index > 0 &&
    item.x - row[index - 1].right > COLUMN_GAP_RATIO * item.fontSize
      ? [{ left: row[index - 1].right, right: item.x }]
      : []
  );

/** Les blancs qui se recouvrent d'une ligne à l'autre, par leur partie commune. */
const sharedGutters = (gaps: (Range & { weight: number })[]): Range[] => {
  const gutters: (Range & { support: number })[] = [];
  for (const gap of [...gaps].sort((a, b) => a.left - b.left)) {
    const shared = gutters.filter(
      (gutter) => gap.left < gutter.right && gap.right > gutter.left
    );
    for (const gutter of shared) {
      gutter.left = Math.max(gutter.left, gap.left);
      gutter.right = Math.min(gutter.right, gap.right);
      gutter.support += gap.weight;
    }
    if (shared.length === 0) {
      gutters.push({ left: gap.left, right: gap.right, support: gap.weight });
    }
  }
  const best = Math.max(0, ...gutters.map((gutter) => gutter.support));
  return gutters
    .filter(
      (gutter) =>
        gutter.support >= Math.max(MIN_GUTTER_SUPPORT, best / 4) &&
        gutter.right - gutter.left >= MIN_GUTTER_WIDTH
    )
    .sort((a, b) => a.left - b.left);
};

/**
 * La suite d'un tableau en haut de la page suivante : ses lignes tiennent
 * dans les colonnes déjà connues, même s'il n'en reste que deux ou trois.
 * Un bandeau de page au-dessus est sauté.
 */
const continueTable = (
  rows: PositionedItem[][],
  previous: ColumnTableContext
): TableRegion | null => {
  const fits = fitsOneColumn(previous.ranges);
  const first = rows.slice(0, MAX_PAGE_BANNER_ROWS + 1).findIndex(fits);
  if (first === -1) {
    return null;
  }
  let last = first;
  while (last < rows.length - 1 && fits(rows[last + 1])) {
    last++;
  }
  const columnIndexOf = columnOf(previous.ranges);
  const items = rows.slice(first, last + 1).flat();
  const used = new Set(items.map(columnIndexOf));
  // L'alignement ne suffit pas : le cartouche d'une fiche (« Pilote »,
  // « Budget ») tombe aussi dans les colonnes. Un tableau numéroté se
  // poursuit par un numéro, qui confirme à lui seul une rangée unique.
  const numbered = items.some(
    (item) =>
      columnIndexOf(item) === previous.mainIndex &&
      ROW_NUMBER.test(item.text.trim())
  );
  const continues = previous.numbered ? numbered : last > first;
  return continues && used.has(previous.mainIndex) && used.size >= 2
    ? { ranges: previous.ranges, first, last }
    : null;
};

/** Les mêmes colonnes qu'à la page précédente, à l'étendue du texte près. */
const sameColumns = (previous: Range[], current: Range[]): boolean =>
  previous.length === current.length &&
  current.every(
    (range, index) =>
      Math.min(range.right, previous[index].right) -
        Math.max(range.left, previous[index].left) >
      0
  );

// « A 12 : », « A 80 Initier », « 3.2. Former » en tête de ligne : le
// numéro d'ordre d'une rangée.
const ROW_NUMBER =
  /^(?:[A-Z]{1,3}\s?\d{1,3}(?:\.\d{1,3})*\s*[:.)]?\s*\p{L}|\d{1,3}(?:\.\d{1,3})*\s*[:.)]\s?\p{L})/u;
const MIN_NUMBERED_ROWS = 2;

const areNumbered = (cells: Cell[]): boolean => {
  const numbered = cells.filter((cell) => ROW_NUMBER.test(cell.text)).length;
  return numbered > 0 && numbered >= cells.length / 2;
};

const cellOf = (lines: CellLine[]): Cell => ({
  text: lines.map((line) => line.text).join(' '),
  top: lines[0].y ?? 0,
  bottom: lines[lines.length - 1].y ?? 0,
  fontSize: lines[0].fontSize ?? 1,
  lineCount: lines.length,
  lines,
});

/**
 * Les lignes d'une colonne, réunies en cellules aux grands interlignes. Une
 * colonne dont les cellules sont numérotées (« A 30 : », « A 31 : ») en ouvre
 * une à chaque numéro, même sans blanc au-dessus.
 */
const toCells = (lines: CellLine[]): Cell[] => {
  const numbered =
    lines.filter((line) => ROW_NUMBER.test(line.text)).length >=
    MIN_NUMBERED_ROWS;
  const groups: CellLine[][] = [];
  for (const line of lines.filter(({ text }) => text.length > 0)) {
    const current = groups.at(-1);
    const previous = current?.at(-1);
    if (
      current &&
      previous &&
      !(numbered && ROW_NUMBER.test(line.text)) &&
      (line.y ?? 0) - (previous.y ?? 0) <=
        CELL_GAP_RATIO * Math.max(line.fontSize ?? 1, previous.fontSize ?? 1)
    ) {
      current.push(line);
    } else {
      groups.push([line]);
    }
  }
  return groups.map(cellOf);
};

/**
 * Dans un tableau aux rangées serrées, les valeurs de deux rangées voisines
 * se touchent et forment une seule cellule. Quand ses lignes se répartissent
 * sur plusieurs rangées et que chaque part est centrée sur la sienne, ce sont
 * autant de cellules. Une cellule fusionnée, centrée sur l'ensemble, reste
 * entière.
 */
const splitAcrossRows = (cells: Cell[], rows: Cell[]): Cell[] =>
  cells.flatMap((cell) => {
    const nearestRow = (line: PageLine) =>
      rows.reduce(
        (best, row, index) =>
          Math.abs(centerOf(row) - (line.y ?? 0)) <
          Math.abs(centerOf(rows[best]) - (line.y ?? 0))
            ? index
            : best,
        0
      );
    const parts: { row: number; lines: CellLine[] }[] = [];
    for (const line of cell.lines) {
      const row = nearestRow(line);
      const current = parts.at(-1);
      if (current && current.row === row) {
        current.lines.push(line);
      } else {
        parts.push({ row, lines: [line] });
      }
    }
    const aligned = parts.every(
      (part) =>
        Math.abs(centerOf(cellOf(part.lines)) - centerOf(rows[part.row])) <=
        ROW_ALIGNMENT_RATIO * cell.fontSize
    );
    return parts.length > 1 && aligned
      ? parts.map((part) => cellOf(part.lines))
      : [cell];
  });

/**
 * La première cellule de chaque colonne, quand elles s'alignent en haut du
 * tableau, sont courtes, et que deux au moins sont des libellés connus.
 */
const readHeader = (
  columns: Column[]
): { labels: string[]; columns: Column[] } | null => {
  const firstCells = columns.flatMap((column) => column.cells.slice(0, 1));
  if (
    columns.length < MIN_TABLE_COLUMNS ||
    firstCells.length < columns.length - 1
  ) {
    return null;
  }
  const top = Math.min(...firstCells.map((cell) => cell.top));
  const isHeaderCell = (cell: Cell | undefined): cell is Cell =>
    cell !== undefined &&
    cell.top - top <= HEADER_BAND_RATIO * cell.fontSize &&
    cell.text.length <= HEADER_MAX_LENGTH &&
    cell.lineCount <= HEADER_MAX_LINES &&
    // Un libellé de colonne : quelques mots, jamais un titre numéroté.
    cell.text.split(/\s+/).length <= HEADER_MAX_WORDS &&
    !/^\d/.test(cell.text);
  const candidates = columns.map((column) =>
    isHeaderCell(column.cells[0]) ? column.cells[0] : null
  );
  const known = candidates.filter(
    (cell): cell is Cell =>
      cell !== null && matchColumnLabel(cell.text) !== null
  );
  // La rangée d'en-tête s'arrête à ses libellés reconnus : sous un en-tête
  // vide, la première valeur de la colonne commence plus bas, dans le corps.
  const headerBottom = Math.max(...known.map((cell) => cell.bottom));
  const headerCells = candidates.map((cell) =>
    cell !== null &&
    (matchColumnLabel(cell.text) !== null ||
      cell.top <= headerBottom + ROW_ALIGNMENT_RATIO * cell.fontSize)
      ? cell
      : null
  );
  const roles = headerCells.map((cell) =>
    cell === null ? null : matchColumnLabel(cell.text)
  );
  // Sans colonne qui nomme les actions (« Actions », « Mesures », « Projets »),
  // ce n'est pas un plan en tableau : une frise « Court terme | Moyen terme »
  // ou le cartouche d'une fiche se lisent mieux ligne par ligne.
  if (
    headerCells.filter((cell) => cell !== null).length < columns.length - 1 ||
    roles.filter((role) => role !== null).length < MIN_HEADER_LABELS ||
    !roles.includes('titre')
  ) {
    return null;
  }
  return {
    labels: headerCells.map((cell) => cell?.text ?? ''),
    columns: columns.map((column, index) =>
      headerCells[index] ? { ...column, cells: column.cells.slice(1) } : column
    ),
  };
};

/** La colonne des actions, sinon celle qui a le plus de cellules. */
const mainColumnOf = (labels: string[], columns: Column[]): number => {
  const titled = labels.findIndex(
    (label) => matchColumnLabel(label) === 'titre'
  );
  if (titled !== -1) {
    return titled;
  }
  return columns.reduce(
    (best, column, index) =>
      column.cells.length > columns[best].cells.length ? index : best,
    0
  );
};

/**
 * Des cartes posées côte à côte : des colonnes de même largeur, qui
 * commencent à la même hauteur et comptent à peu près autant de blocs. Une
 * colonne de lettres face à une colonne de titres n'en est pas.
 */
const areSideBySideCards = (columns: Column[]): boolean => {
  const widths = columns.map((column) => column.right - column.left);
  const counts = columns.map((column) => column.cells.length);
  const tops = columns.map((column) => column.cells[0]?.top ?? Infinity);
  const fontSize = columns[0].cells[0]?.fontSize ?? 1;
  const meanLength = (column: Column) =>
    column.cells.reduce((sum, cell) => sum + cell.text.length, 0) /
    Math.max(1, column.cells.length);
  return (
    // Une carte porte des phrases : une colonne de croix ou de libellés
    // n'en est pas une.
    Math.min(...widths) >= CARD_MIN_WIDTH_RATIO * fontSize &&
    columns.every((column) => meanLength(column) >= CARD_MIN_MEAN_LENGTH) &&
    Math.min(...counts) >= CARD_MIN_CELLS &&
    Math.max(...counts) - Math.min(...counts) <= CARD_MAX_CELL_GAP &&
    Math.max(...widths) <= CARD_MAX_WIDTH_RATIO * Math.min(...widths) &&
    Math.max(...tops) - Math.min(...tops) <= HEADER_BAND_RATIO * fontSize &&
    // Le bloc du haut est un titre, pas un premier paragraphe.
    columns.every(
      (column) =>
        column.cells[0].text.length <= CARD_TITLE_MAX_LENGTH &&
        column.cells[0].lineCount <= CARD_TITLE_MAX_LINES
    ) &&
    // Deux colonnes sont le plus souvent un texte et son cartouche, ou une
    // page de prose : deux cartes se reconnaissent à leur texte centré et à
    // leurs blocs en même nombre.
    (columns.length >= MIN_TABLE_COLUMNS ||
      (columns.every((column) => column.centered) &&
        Math.min(...counts) === Math.max(...counts) &&
        Math.min(...counts) >= TWO_CARDS_MIN_CELLS))
  );
};

/**
 * Des lignes centrées : leurs milieux tombent au même endroit, pas leurs
 * débuts. Une prose alignée à gauche ou justifiée commence toujours au même
 * endroit.
 */
const areCentered = (lines: PositionedItem[][]): boolean => {
  if (lines.length < CENTERED_MIN_LINES) {
    return false;
  }
  const fontSize = lines[0][0].fontSize;
  const lefts = lines.map((line) => line[0].x);
  const centers = lines
    .map(
      (line) => (line[0].x + Math.max(...line.map((item) => item.right))) / 2
    )
    .sort((a, b) => a - b);
  const middle = centers[Math.floor(centers.length / 2)];
  return (
    Math.max(...lefts) - Math.min(...lefts) > COLUMN_GAP_RATIO * fontSize &&
    centers.filter(
      (center) =>
        Math.abs(center - middle) <= CENTERED_TOLERANCE_RATIO * fontSize
    ).length >=
      CENTERED_SHARE * centers.length
  );
};

// Le bloc du haut de chaque carte est son titre : rendu en titre de fiche,
// il garde avec lui sa description et son objectif.
const readColumnByColumn = (columns: Column[]): PageLine[] =>
  columns.flatMap((column) =>
    column.cells.map((cell, index) =>
      toLine(cell, index === 0 ? `### ${cell.text}` : cell.text)
    )
  );

const linksOf = (cells: Cell[]): DocumentLink[] =>
  cells.flatMap((cell) => cell.lines.flatMap((line) => line.links ?? []));

/** Une ligne à la place de la cellule, avec les liens du texte qu'elle porte. */
const toLine = (
  cell: Cell,
  text = cell.text,
  links = linksOf([cell])
): PageLine => ({
  text,
  fontSize: cell.fontSize,
  y: cell.top,
  ...(links.length > 0 ? { links } : {}),
});

const readRowByRow = ({
  columns,
  labels,
  mainIndex,
  groupTexts: previousGroupTexts,
}: {
  columns: Column[];
  labels: string[];
  mainIndex: number;
  groupTexts: string[];
}): { lines: PageLine[]; groupTexts: string[]; numbered: boolean } => {
  const rows = splitAtRowStarts(
    columns[mainIndex].cells,
    columns.slice(mainIndex + 1)
  );
  // Seules les colonnes de droite portent une valeur par rangée : à gauche,
  // un regroupement couvre plusieurs rangées par nature.
  const cellsOf = (index: number) =>
    index > mainIndex && rows.length > 0
      ? splitAcrossRows(columns[index].cells, rows)
      : columns[index].cells;
  const cellsOfRow = columns.map((_, index) =>
    index === mainIndex ? [] : assignCells(rows, cellsOf(index))
  );
  const groupTexts = [...previousGroupTexts];
  const lines: PageLine[] = [];
  const labelled = (index: number, text: string) =>
    labels[index] ? `${labels[index]} : ${text}` : text;
  // Des rangées numérotées (« A 12 : », « 3.2 ») sont les actions du plan :
  // chacune ouvre sa fiche, titrée par le premier paragraphe de sa cellule.
  const numbered = areNumbered(rows);
  const edge = Math.max(
    ...rows.flatMap((row) => row.lines.map((line) => line.right))
  );

  rows.forEach((row, rowIndex) => {
    // Une rangée sans numéro (suite d'une cellule coupée par la page, « À
    // définir ») reste dans la fiche d'au-dessus.
    const opensFiche = numbered && ROW_NUMBER.test(row.text);
    const groups: PageLine[] = [];
    for (let index = 0; index < mainIndex; index++) {
      const { text, links } = textOf(
        cellsOf(index),
        cellsOfRow[index][rowIndex]
      );
      // Sous des fiches, un regroupement intermédiaire se redit à chacune :
      // dit une seule fois, il manquerait aux fiches suivantes.
      const repeated = text === groupTexts[index] && !(opensFiche && index > 0);
      if (text === '' || repeated) {
        continue;
      }
      groupTexts[index] = text;
      // Le regroupement le plus à gauche est le niveau au-dessus des rangées.
      // Les autres précèdent leur première rangée ; sous une fiche, ils la
      // suivent, sans quoi ils finiraient la fiche d'avant.
      const line = toLine(
        row,
        index === 0 ? `## ${text}` : labelled(index, text),
        links
      );
      (index > 0 && numbered ? groups : lines).push(line);
    }
    if (opensFiche) {
      const [title, rest] = splitTitle(row, edge);
      lines.push(toLine(row, `### ${title.text}`, linksOf([title])));
      if (rest) {
        lines.push(toLine(row, rest.text, linksOf([rest])));
      }
    } else {
      lines.push(toLine(row));
    }
    lines.push(...groups);
    for (let index = mainIndex + 1; index < columns.length; index++) {
      const { text, links } = textOf(
        cellsOf(index),
        cellsOfRow[index][rowIndex]
      );
      if (text !== '') {
        lines.push(toLine(row, labelled(index, text), links));
      }
    }
  });
  return { lines, groupTexts, numbered };
};

/**
 * Le titre d'une cellule s'arrête à la fin de son premier paragraphe : la
 * dernière ligne d'un paragraphe s'arrête avant le bord, assez tôt pour que
 * le premier mot de la ligne suivante y ait tenu (« …de Fayence » » puis
 * « Volet 1 : … », ou une puce). Un guillemet ou une parenthèse ouvrante
 * passe à la ligne avec son mot.
 */
const splitTitle = (cell: Cell, edge: number): [Cell, Cell | null] => {
  const end = cell.lines.findIndex((line, index) => {
    const next = cell.lines[index + 1];
    if (next === undefined) {
      return false;
    }
    const charWidth = (line.right - line.left) / Math.max(1, line.text.length);
    const nextWord = next.text.trim().match(/^[«“"(]?\s*\S+/u)?.[0] ?? '';
    return (
      edge - line.right >
      (nextWord.length + 1) * charWidth +
        WRAP_TOLERANCE_RATIO * (line.fontSize ?? 0)
    );
  });
  return end === -1
    ? [cell, null]
    : [cellOf(cell.lines.slice(0, end + 1)), cellOf(cell.lines.slice(end + 1))];
};

const textOf = (
  cells: Cell[],
  cellIndexes: number[] | undefined
): { text: string; links: DocumentLink[] } => {
  const read = (cellIndexes ?? []).map((index) => cells[index]);
  return {
    text: read.map((cell) => cell.text).join(' '),
    links: linksOf(read),
  };
};

/**
 * Des actions sans numéro, aux rangées serrées, se touchent et forment une
 * seule cellule. Quand les valeurs de droite s'alignent en haut de chaque
 * rangée, une ligne en face de laquelle chacune de ces colonnes ouvre une
 * valeur ouvre une rangée. Des valeurs centrées sur leur rangée ne coupent
 * rien, et des rangées numérotées sont déjà séparées par leur numéro.
 */
const splitAtRowStarts = (cells: Cell[], others: Column[]): Cell[] => {
  if (areNumbered(cells)) {
    return cells;
  }
  return cells.flatMap((cell) => {
    const opensAt = (column: Column, line: PageLine) =>
      column.cells.some(
        (other) =>
          Math.abs(other.top - (line.y ?? 0)) <=
          ROW_ALIGNMENT_RATIO * cell.fontSize
      );
    const markers = others.filter((column) => opensAt(column, cell.lines[0]));
    if (cell.lines.length < 2 || markers.length === 0) {
      return [cell];
    }
    const parts: CellLine[][] = [];
    cell.lines.forEach((line, index) => {
      if (index === 0 || markers.every((column) => opensAt(column, line))) {
        parts.push([line]);
      } else {
        parts[parts.length - 1].push(line);
      }
    });
    return parts.map(cellOf);
  });
};

const centerOf = (cell: Cell): number => (cell.top + cell.bottom) / 2;

/**
 * Pour chaque rangée, les cellules d'une autre colonne qui lui reviennent.
 * Une cellule fusionnée sur plusieurs rangées est centrée sur leur ensemble :
 * les rangées sont partagées en groupes contigus, un par cellule, de façon
 * que le milieu de chaque groupe tombe sur celui de sa cellule. Une rangée
 * peut rester sans cellule.
 */
const assignCells = (rows: Cell[], cells: Cell[]): number[][] => {
  const assigned: number[][] = rows.map(() => []);
  if (cells.length === 0 || rows.length === 0) {
    return assigned;
  }
  if (cells.length > rows.length) {
    // Plus de cellules que de rangées : chacune va à la rangée la plus proche.
    cells.forEach((cell, cellIndex) => {
      const nearest = rows.reduce(
        (best, row, rowIndex) =>
          Math.abs(centerOf(row) - centerOf(cell)) <
          Math.abs(centerOf(rows[best]) - centerOf(cell))
            ? rowIndex
            : best,
        0
      );
      assigned[nearest].push(cellIndex);
    });
    return assigned;
  }

  const rowCount = rows.length;
  const cellCount = cells.length;
  const pitches = rows
    .slice(1)
    .map((row, index) => centerOf(row) - centerOf(rows[index]))
    .sort((a, b) => a - b);
  const unassignedCost =
    UNASSIGNED_ROW_PITCH_SHARE *
    (pitches[Math.floor(pitches.length / 2)] ?? DEFAULT_ROW_PITCH);
  // cost[i][j] : meilleur coût pour les i premières rangées et les j premières cellules.
  const cost = Array.from({ length: rowCount + 1 }, () =>
    Array<number>(cellCount + 1).fill(Infinity)
  );
  // from[i][j] : première rangée du groupe de la cellule j, ou -1 si la rangée i reste seule.
  const from = Array.from({ length: rowCount + 1 }, () =>
    Array<number>(cellCount + 1).fill(-1)
  );
  cost[0][0] = 0;
  for (let i = 1; i <= rowCount; i++) {
    for (let j = 0; j <= cellCount; j++) {
      if (cost[i - 1][j] + unassignedCost < cost[i][j]) {
        cost[i][j] = cost[i - 1][j] + unassignedCost;
        from[i][j] = -1;
      }
      if (j === 0) {
        continue;
      }
      for (let start = 0; start < i; start++) {
        const groupCenter = (rows[start].top + rows[i - 1].bottom) / 2;
        const candidate =
          cost[start][j - 1] + Math.abs(groupCenter - centerOf(cells[j - 1]));
        if (candidate < cost[i][j]) {
          cost[i][j] = candidate;
          from[i][j] = start;
        }
      }
    }
  }
  let i = rowCount;
  let j = cellCount;
  while (i > 0) {
    const start = from[i][j];
    if (start === -1) {
      i--;
      continue;
    }
    for (let rowIndex = start; rowIndex < i; rowIndex++) {
      assigned[rowIndex].push(j - 1);
    }
    i = start;
    j--;
  }
  return assigned;
};

const placeByY = (lines: PageLine[]): PageLine[] =>
  lines
    .map((line, index) => ({ line, index }))
    .sort((a, b) => (a.line.y ?? 0) - (b.line.y ?? 0) || a.index - b.index)
    .map(({ line }) => line);
