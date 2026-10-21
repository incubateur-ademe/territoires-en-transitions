import { maxBy } from 'es-toolkit';
import { matchHeading } from '../segment-document/heading-patterns';
import { ClassifiedRow } from './classify-grid-rows';
import { ROLE_SHARE } from './profile-columns';
import {
  collapseSpaces,
  filledCellsOf,
  getCellValueAt,
  SheetGrid,
} from './sheet-grid';

// « 1 », « 1.2 », « 1.2.3 » ; pas « 0.035 », une valeur.
const OUTLINE_NUMBER = /^[1-9]\d{0,2}(?:\.(?:[1-9]\d{0,2}|0)){0,3}$/;
const FICHE_DEPTH_MIN_ATTRIBUTES = 0.5;

export type OutlineRows = {
  rows: ClassifiedRow[];
  /** La profondeur de numérotation de chaque bandeau qu'elle a fait. */
  levels: Map<number, number>;
  isOutline: boolean;
  /** Les rangées numérotées sous chaque fiche, plus profondes qu'elle : ses sous-actions. */
  subRows: Map<number, number[]>;
};

/**
 * Une colonne de numéros à plusieurs profondeurs (1, 1.2, 1.2.3). La fiche
 * est la moins profonde qui porte des attributs (pilote, statut) en plus de
 * son intitulé ; au-dessus, les rangées qui ne portent qu'un intitulé sont
 * des niveaux d'axe, lus comme des bandeaux ; en dessous, des sous-actions.
 */
export const readOutline = (
  grid: SheetGrid,
  rows: ClassifiedRow[]
): OutlineRows => {
  const dataRows = rows.filter(({ kind }) => kind === 'data');
  const none: OutlineRows = {
    rows,
    levels: new Map(),
    isOutline: false,
    subRows: new Map(),
  };
  if (dataRows.length === 0) {
    return none;
  }
  for (let col = 1; col <= grid.colCount; col++) {
    const depths = new Map<number, number>();
    for (const { row } of dataRows) {
      const value = getCellValueAt(grid, row, col).replace(/\.$/, '');
      if (OUTLINE_NUMBER.test(value)) {
        depths.set(row, value.split('.').length);
      }
    }
    if (
      depths.size < dataRows.length * ROLE_SHARE ||
      new Set(depths.values()).size < 2
    ) {
      continue;
    }
    const ficheDepth = findFicheDepth(grid, depths, col);
    const levels = new Map<number, number>();
    const subRows = new Map<number, number[]>();
    let fiche: number | null = null;
    const converted = rows.map((entry): ClassifiedRow => {
      const depth = depths.get(entry.row);
      if (entry.kind !== 'data' || depth === undefined) {
        return entry;
      }
      if (depth === ficheDepth) {
        fiche = entry.row;
      } else if (depth > ficheDepth && fiche !== null) {
        subRows.set(fiche, [...(subRows.get(fiche) ?? []), entry.row]);
      } else if (depth < ficheDepth) {
        fiche = null;
        const text = longestText(grid, entry.row, col);
        if (text !== '') {
          levels.set(entry.row, depth);
          return { row: entry.row, kind: 'banner', text };
        }
      }
      return entry;
    });
    return { rows: converted, levels, isOutline: true, subRows };
  }
  return none;
};

const findFicheDepth = (
  grid: SheetGrid,
  depths: Map<number, number>,
  col: number
): number => {
  const byDepth = new Map<number, number[]>();
  for (const [row, depth] of depths) {
    byDepth.set(depth, [...(byDepth.get(depth) ?? []), row]);
  }
  const sorted = [...byDepth.keys()].sort((a, b) => a - b);
  return (
    sorted.find((depth) => {
      const rows = byDepth.get(depth) ?? [];
      const withAttributes = rows.filter(
        (row) =>
          filledCellsOf(grid, row).filter((cell) => cell.col !== col).length > 1
      ).length;
      return withAttributes / rows.length >= FICHE_DEPTH_MIN_ATTRIBUTES;
    }) ?? Math.max(...sorted)
  );
};

const longestText = (grid: SheetGrid, row: number, skipCol: number): string =>
  collapseSpaces(
    maxBy(
      filledCellsOf(grid, row).filter(
        (cell) => cell.col !== skipCol && cell.kind === 'text'
      ),
      (cell) => cell.text.length
    )?.text ?? ''
  );

/** Le chemin de bandeaux au-dessus de chaque rangée de données. */
export const readBannerPaths = (
  rows: ClassifiedRow[],
  outlineLevels: Map<number, number>
): Map<number, string[]> => {
  const banners = rows.filter(({ kind }) => kind === 'banner');
  const levelOf = rankBannerLevels(banners, outlineLevels);
  const paths = new Map<number, string[]>();
  let stack: { level: number; text: string }[] = [];
  for (const entry of rows) {
    if (entry.kind === 'banner') {
      const level = levelOf.get(entry.row) ?? 1;
      stack = [
        ...stack.filter((banner) => banner.level < level),
        { level, text: entry.text ?? '' },
      ];
    } else if (entry.kind === 'data') {
      paths.set(
        entry.row,
        stack.map(({ text }) => text)
      );
    }
  }
  return paths;
};

/**
 * Le niveau de chaque bandeau, d'après sa numérotation (« Axe 1 », « 1.2 »)
 * ; un bandeau sans numéro prend le niveau le plus courant.
 */
const rankBannerLevels = (
  banners: ClassifiedRow[],
  outlineLevels: Map<number, number>
): Map<number, number> => {
  const known = new Map<number, number>();
  for (const { row, text } of banners) {
    const level = outlineLevels.get(row) ?? headingLevel(text ?? '');
    if (level !== null) {
      known.set(row, level);
    }
  }
  // Par ordre d'apparition : à égalité, le premier niveau rencontré l'emporte.
  const counts = new Map<number, number>();
  for (const level of known.values()) {
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }
  const usual = maxBy([...counts.entries()], ([, count]) => count)?.[0] ?? 1;
  const raw = new Map(
    banners.map(({ row }) => [row, known.get(row) ?? usual] as const)
  );
  const ranks = [...new Set(raw.values())].sort((a, b) => a - b);
  return new Map(
    [...raw.entries()].map(([row, level]) => [row, ranks.indexOf(level) + 1])
  );
};

const headingLevel = (text: string): number | null => {
  const heading = matchHeading(text.replace(/\s+/g, ' '));
  if (!heading || heading.number === null) {
    return null;
  }
  return heading.kind === 'axe' ? 1 : heading.level;
};
