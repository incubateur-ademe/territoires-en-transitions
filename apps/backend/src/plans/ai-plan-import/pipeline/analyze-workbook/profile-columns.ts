import { uniq } from 'es-toolkit';
import { ClassifiedRow } from './classify-grid-rows';
import { mapTabularStatut } from './map-tabular-statut';
import {
  getCellValueAt,
  getGridCell,
  isInVerticalMerge,
  SheetGrid,
} from './sheet-grid';

/** Rangées de suite qui partagent une valeur, fusionnée ou répétée. */
export type ColumnBlock = { rows: number[]; value: string; merged: boolean };

export type ColumnProfile = {
  col: number;
  label: string;
  /** Rangées de données où la colonne a une valeur. */
  filledRows: number;
  /** Part des rangées de données remplies. */
  fillRatio: number;
  blocks: ColumnBlock[];
  /** Blocs de plus d'une rangée. */
  multiRowBlocks: number;
  hasVerticalMerges: boolean;
  distinctValues: number;
  /** Valeurs distinctes par bloc : 1 quand aucune valeur ne revient d'un bloc à l'autre. */
  distinctRatio: number;
  /** Blocs par rangée remplie : 1 quand la valeur change à chaque rangée. */
  runsRatio: number;
  // Parts calculées sur les blocs : une valeur fusionnée ne compte qu'une fois.
  numericShare: number;
  crossShare: number;
  dateShare: number;
  numberingShare: number;
  organisationShare: number;
  /** Intitulés numérotés (« Axe 1. … ») : un niveau d'axe, pas un pilote. */
  headingShare: number;
  statutShare: number;
  averageLength: number;
  /** Peu de valeurs, courtes, qui reviennent : statut, priorité, oui/non. */
  isClosedList: boolean;
  /** L'année que le libellé annonce (« CALENDRIER · 2021 »). */
  labelYear: number | null;
};

/** La valeur d'une cellule de donnée, fusions et remplissage vers le bas compris. */
export type ReadValue = (row: number, col: number) => string;

/** Part des valeurs qui suffit à donner un rôle à une colonne. */
export const ROLE_SHARE = 0.8;
/** Une colonne de regroupement ne réemploie presque jamais une valeur d'un bloc à l'autre. */
export const GROUPING_MIN_DISTINCT = 0.8;
const PILOTE_MIN_ORGANISATION_SHARE = 0.6;
const PILOTE_MAX_LENGTH = 60;
const PILOTE_SHORT_LENGTH = 25;
const NUMBERING_MIN_DISTINCT = 0.9;
const NUMBERING_MIN_ASCENDING = 0.7;

const CLOSED_LIST_MAX_VALUES = 12;
const CLOSED_LIST_MAX_LENGTH = 30;

const CROSS = /^(?:x|✓|✔|✗|•|●|■|oui)$/i;
// « 12 », « 2.3.1 », « MOB-4 » ; pas « 0.035 » ni « 1500 ».
const NUMBERING =
  /^(?:[1-9]\d{0,2}(?:\.\d{1,2}){0,3}\.?|[A-Z]{1,6}[-_ .]?\d{1,3}(?:\.\d{1,2}){0,3})$/i;
// « 12 000 € », « 1,5 k€ », « 1,2 M€ », « 3 millions d'euros », « 800 € HT ».
const AMOUNT =
  /^[-+]?\d[\d\s.,]*(?:(?:k|M|millions?(?:\s+d['’])?)?\s*(?:€|euros?)|\s*k)?(?:\s*(?:HT|TTC))?$/i;
const THOUSANDS = /k(?:€|\s*euros?)?\s*(?:HT|TTC)?$/i;
const MILLIONS = /(?:M|millions?(?:\s+d['’])?)\s*(?:€|euros?)/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T[\d:.]+Z?)?$/;
const FRENCH_DATE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
const YEAR = /(?:^|\D)((?:19|20)\d{2})(?:\D|$)/;
const YEARS = /(?:^|\D)((?:19|20)\d{2})(?=\D|$)/g;
// Sigle, « / » entre deux structures, ou nom d'organisme : un pilote, pas un titre.
const ACRONYM = /\/|(?<![\p{L}\p{N}])\p{Lu}{2,}(?![\p{L}\p{N}])/u;
const ORGANISATION_WORD =
  /(?<!\p{L})(?:communes?|r[ée]gions?|d[ée]partements?|syndicats?|interco\w*|communaut[ée]s?|mairies?|villes?|services?|directions?|associations?|chambres?|agences?|offices?|[ée]tat|pr[ée]fectures?|bailleurs?|conseils?|cabinets?|bureaux?|[ée]lus?|[àa] d[ée]finir)(?!\p{L})/iu;
const ORGANISATION_MAX_LENGTH = 80;
// « Axe 1. … », « 2.3 – … », « I. … » : un intitulé numéroté, jamais un pilote.
const NUMBERED_HEADING =
  /^(?:[\p{L}'’]+\s+){0,3}(?:n[°º]\s*)?(?:\d{1,2}(?:\.\d{1,2}){0,3}|[IVX]{1,4})\s*[.):\-–—]\s*\S/u;

export const isCrossValue = (value: string): boolean =>
  CROSS.test(value.trim());

export const isNumberingValue = (value: string): boolean =>
  NUMBERING.test(value.trim());

/** Un montant : « 3000000 », « 12 000 € », « 1,5 k€ », « 1,2 M€ ». */
export const parseAmount = (value: string): number | null => {
  const text = value.trim();
  if (!AMOUNT.test(text)) {
    return null;
  }
  const multiplier = MILLIONS.test(text)
    ? 1_000_000
    : THOUSANDS.test(text)
    ? 1000
    : 1;
  const digits = (/^[-+]?\d[\d\s.,]*/.exec(text)?.[0] ?? '').replace(/\s/g, '');
  // « 1.234,5 » ou « 1,234.5 » : le dernier séparateur est la virgule décimale.
  const normalized = /,\d{1,2}$/.test(digits)
    ? digits.replace(/\./g, '').replace(',', '.')
    : digits.replace(/,/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount * multiplier : null;
};

// Entre 1954 et 2119 : un nombre de jours depuis le 30/12/1899 qu'Excel
// garde quand la cellule a perdu son format de date.
const SERIAL_DATE = /^[2-8]\d{4}$/;
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;

/**
 * La date au format AAAA-MM-JJ, d'une date Excel ou d'un texte JJ/MM/AAAA ;
 * d'un numéro de série Excel aussi quand la colonne se dit colonne de dates.
 */
export const parseDateValue = (
  value: string,
  { serial = false }: { serial?: boolean } = {}
): string | null => {
  const text = value.trim();
  if (serial && SERIAL_DATE.test(text)) {
    return new Date(EXCEL_EPOCH_MS + Number(text) * DAY_MS)
      .toISOString()
      .slice(0, 10);
  }
  const iso = ISO_DATE.exec(text);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const french = FRENCH_DATE.exec(text);
  if (french) {
    const [, day, month, year] = french;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
};

export const yearOf = (text: string): number | null => {
  const match = YEAR.exec(text);
  return match ? Number(match[1]) : null;
};

/** Les années citées par un texte : « 2025-2027 » en donne deux. */
export const yearsIn = (text: string): number[] =>
  [...text.matchAll(YEARS)].map((match) => Number(match[1]));

export const isOrganisationLike = (value: string): boolean =>
  value.length <= ORGANISATION_MAX_LENGTH &&
  (ACRONYM.test(value) || ORGANISATION_WORD.test(value));

export const isNumberedHeading = (value: string): boolean =>
  NUMBERED_HEADING.test(value.trim());

/**
 * La valeur de chaque cellule de donnée. Une esclave de fusion prend celle de
 * son maître ; une case vide en tête de rangée prend celle du dessus (un CSV
 * ne répète pas les regroupements), sauf sous une fusion : sa fin clôt le
 * bloc, et seule une valeur écrite une fois puis laissée vide se prolonge.
 */
export const readGridValues = (
  grid: SheetGrid,
  rows: ClassifiedRow[]
): ReadValue => {
  const filled = new Map<string, string>();
  const columnsWithMerges = new Set<number>();
  const segments = splitSegments(rows);
  for (const segment of segments) {
    for (const row of segment) {
      for (let col = 1; col <= grid.colCount; col++) {
        if (isInVerticalMerge(getGridCell(grid, row, col))) {
          columnsWithMerges.add(col);
        }
      }
    }
  }
  for (const segment of segments) {
    segment.forEach((row, index) => {
      if (index === 0) {
        return;
      }
      const previous = segment[index - 1];
      const firstFilled = firstFilledColumn(grid, row);
      for (let col = 1; col < firstFilled; col++) {
        const fromAbove = filled.get(`${previous}:${col}`);
        if (
          fromAbove === undefined &&
          columnsWithMerges.has(col) &&
          isInVerticalMerge(getGridCell(grid, previous, col))
        ) {
          continue;
        }
        const above = fromAbove ?? getCellValueAt(grid, previous, col);
        if (above !== '') {
          filled.set(`${row}:${col}`, above);
        }
      }
    });
  }
  return (row, col) =>
    filled.get(`${row}:${col}`) ?? getCellValueAt(grid, row, col);
};

/** Les rangées de données, coupées aux bandeaux et aux totaux. */
export const splitSegments = (rows: ClassifiedRow[]): number[][] => {
  const segments: number[][] = [];
  let current: number[] = [];
  for (const { row, kind } of rows) {
    if (kind === 'data') {
      current.push(row);
    } else if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    segments.push(current);
  }
  return segments;
};

const firstFilledColumn = (grid: SheetGrid, row: number): number => {
  const cell = (grid.cells[row - 1] ?? []).find(
    (candidate) => getCellValueAt(grid, row, candidate.col) !== ''
  );
  return cell?.col ?? grid.colCount + 1;
};

/**
 * Les blocs d'une colonne : une valeur vide ou un bandeau en coupe un. Sans
 * fusion, une valeur répétée sous un autre regroupement (`contextCols`, à
 * gauche) ouvre un nouveau bloc : deux fiches homonymes de deux objectifs
 * voisins restent deux fiches.
 */
export const readColumnBlocks = (
  grid: SheetGrid,
  segments: number[][],
  col: number,
  valueAt: ReadValue,
  contextCols: number[] = []
): ColumnBlock[] => {
  const blocks: ColumnBlock[] = [];
  for (const segment of segments) {
    let previousKey: string | null = null;
    for (const row of segment) {
      const value = valueAt(row, col);
      if (value === '') {
        previousKey = null;
        continue;
      }
      const cell = getGridCell(grid, row, col);
      const merged = isInVerticalMerge(cell);
      const key = merged
        ? `fusion:${cell?.masterRow}:${cell?.masterCol}`
        : `valeur:${contextCols
            .map((context) => valueAt(row, context))
            .join('\t')}\t${value}`;
      const current = blocks.at(-1);
      if (key === previousKey && current) {
        current.rows.push(row);
      } else {
        blocks.push({ rows: [row], value, merged });
      }
      previousKey = key;
    }
  }
  return blocks;
};

/**
 * Les valeurs d'une colonne sur ces rangées, une par cellule : une cellule
 * fusionnée sur plusieurs rangées n'est lue qu'une fois.
 */
export const readCellValues = (
  grid: SheetGrid,
  valueAt: ReadValue,
  col: number,
  rows: number[]
): string[] => {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const row of rows) {
    const value = valueAt(row, col);
    if (value === '') {
      continue;
    }
    const cell = getGridCell(grid, row, col);
    const key = isInVerticalMerge(cell)
      ? `${cell?.masterRow}:${cell?.masterCol}`
      : `${row}`;
    if (!seen.has(key)) {
      seen.add(key);
      values.push(value);
    }
  }
  return values;
};

/** Les valeurs distinctes : un texte répété sur les rangées d'une fiche compte une fois. */
export const readDistinctValues = (
  grid: SheetGrid,
  valueAt: ReadValue,
  col: number,
  rows: number[]
): string[] => uniq(readCellValues(grid, valueAt, col, rows));

export const isTextColumn = (profile: ColumnProfile): boolean =>
  profile.filledRows > 0 &&
  profile.numericShare < 0.5 &&
  profile.crossShare < 0.5 &&
  profile.dateShare < 0.5;

/** Des numéros de fiche : « 12 », « 2.3 », « MOB-4 », distincts et croissants. */
export const isNumberingColumn = (profile: ColumnProfile): boolean => {
  if (
    profile.filledRows === 0 ||
    profile.numberingShare < ROLE_SHARE ||
    profile.distinctRatio < NUMBERING_MIN_DISTINCT
  ) {
    return false;
  }
  const values = profile.blocks.map(({ value }) => value);
  if (values.some((value) => /[a-z]/i.test(value))) {
    return true;
  }
  let ascending = 0;
  for (let index = 1; index < values.length; index++) {
    if (compareNumbering(values[index - 1], values[index]) < 0) {
      ascending += 1;
    }
  }
  return (
    values.length < 2 ||
    ascending / (values.length - 1) >= NUMBERING_MIN_ASCENDING
  );
};

const compareNumbering = (a: string, b: string): number => {
  const left = a.split('.').filter(Boolean).map(Number);
  const right = b.split('.').filter(Boolean).map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? -1) - (right[index] ?? -1);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
};

/**
 * Des noms de structures : sigles, « / » entre deux structures, et des
 * valeurs qui reviennent d'une fiche à l'autre (« Interco ») ou très courtes.
 * Un intitulé d'objectif qui cite un sigle ne revient pas.
 */
export const isPiloteLikeColumn = (profile: ColumnProfile): boolean =>
  profile.organisationShare >= PILOTE_MIN_ORGANISATION_SHARE &&
  profile.headingShare < 0.5 &&
  profile.averageLength <= PILOTE_MAX_LENGTH &&
  (profile.distinctRatio < GROUPING_MIN_DISTINCT ||
    profile.averageLength <= PILOTE_SHORT_LENGTH);

export const profileColumns = (
  grid: SheetGrid,
  rows: ClassifiedRow[],
  labels: string[],
  valueAt: ReadValue
): ColumnProfile[] => {
  const segments = splitSegments(rows);
  const dataRowCount = segments.reduce((total, rows) => total + rows.length, 0);
  const profileAll = (contextOf: (col: number) => number[]) =>
    Array.from({ length: grid.colCount }, (_, index) =>
      profileColumn(
        grid,
        segments,
        dataRowCount,
        index + 1,
        labels[index] ?? '',
        valueAt,
        contextOf(index + 1)
      )
    );
  // Les colonnes qui regroupent des rangées par répétition servent de
  // contexte aux colonnes à leur droite.
  const repeating = profileAll(() => [])
    .filter(
      (profile) =>
        !profile.hasVerticalMerges &&
        profile.multiRowBlocks > 0 &&
        profile.runsRatio <= 0.9 &&
        profile.numericShare < 0.5 &&
        profile.crossShare < 0.5
    )
    .map(({ col }) => col);
  return profileAll((col) => repeating.filter((context) => context < col));
};

const profileColumn = (
  grid: SheetGrid,
  segments: number[][],
  dataRowCount: number,
  col: number,
  label: string,
  valueAt: ReadValue,
  contextCols: number[]
): ColumnProfile => {
  const blocks = readColumnBlocks(grid, segments, col, valueAt, contextCols);
  const values = blocks.map(({ value }) => value);
  const filledRows = blocks.reduce((total, { rows }) => total + rows.length, 0);
  const distinctValues = new Set(values).size;
  const shareOf = (predicate: (value: string) => boolean) =>
    values.length === 0 ? 0 : values.filter(predicate).length / values.length;
  const averageLength =
    values.length === 0
      ? 0
      : values.reduce((total, value) => total + value.length, 0) /
        values.length;
  return {
    col,
    label,
    filledRows,
    fillRatio: dataRowCount === 0 ? 0 : filledRows / dataRowCount,
    blocks,
    multiRowBlocks: blocks.filter(({ rows }) => rows.length > 1).length,
    hasVerticalMerges: blocks.some(({ merged }) => merged),
    distinctValues,
    distinctRatio: blocks.length === 0 ? 0 : distinctValues / blocks.length,
    runsRatio: filledRows === 0 ? 0 : blocks.length / filledRows,
    numericShare: shareOf((value) => parseAmount(value) !== null),
    crossShare: shareOf(isCrossValue),
    dateShare: shareOf((value) => parseDateValue(value) !== null),
    numberingShare: shareOf(isNumberingValue),
    organisationShare: shareOf(isOrganisationLike),
    headingShare: shareOf(isNumberedHeading),
    statutShare: shareOf((value) => mapTabularStatut(value) !== null),
    averageLength,
    isClosedList:
      distinctValues > 0 &&
      distinctValues <= CLOSED_LIST_MAX_VALUES &&
      averageLength <= CLOSED_LIST_MAX_LENGTH &&
      filledRows >= 4 &&
      filledRows >= 2 * distinctValues,
    labelYear: yearOf(label.split(' · ').at(-1) ?? ''),
  };
};
