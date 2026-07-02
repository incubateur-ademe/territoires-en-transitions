import { match } from 'ts-pattern';
import { toDisplayRows } from '../grid-model';
import { generateCellKey, CellKey, GridRowGroup, Year } from '../types';

export type NavDirection = 'up' | 'down' | 'next' | 'previous';

export const buildNavigableKeys = ({
  groups,
  years,
}: {
  groups: GridRowGroup[];
  years: Year[];
}): CellKey[][] =>
  toDisplayRows(groups).map((displayRow) =>
    years.map((year) => generateCellKey(displayRow.indicateurId, year))
  );

type CellPosition = { row: number; col: number };

const findCellPosition = (
  navigableKeys: CellKey[][],
  key: CellKey
): CellPosition | null => {
  const row = navigableKeys.findIndex((rowKeys) => rowKeys.includes(key));
  if (row === -1) {
    return null;
  }
  return { row, col: navigableKeys[row].indexOf(key) };
};

const goUp = (
  navigableKeys: CellKey[][],
  { row, col }: CellPosition
): CellKey | null => navigableKeys[row - 1]?.[col] ?? null;

const goDown = (
  navigableKeys: CellKey[][],
  { row, col }: CellPosition
): CellKey | null => navigableKeys[row + 1]?.[col] ?? null;

const goNext = (
  navigableKeys: CellKey[][],
  { row, col }: CellPosition
): CellKey | null => {
  const nextInRow = navigableKeys[row][col + 1];
  if (nextInRow !== undefined) {
    return nextInRow;
  }
  return navigableKeys[row + 1]?.[0] ?? null;
};

const goPrevious = (
  navigableKeys: CellKey[][],
  { row, col }: CellPosition
): CellKey | null => {
  const previousInRow = navigableKeys[row][col - 1];
  if (previousInRow !== undefined) {
    return previousInRow;
  }
  const previousRow = navigableKeys[row - 1];
  return previousRow?.[previousRow.length - 1] ?? null;
};

export const getNextNavKey = (
  navigableKeys: CellKey[][],
  fromKey: CellKey,
  direction: NavDirection
): CellKey | null => {
  const position = findCellPosition(navigableKeys, fromKey);
  if (position === null) {
    return null;
  }
  return match(direction)
    .with('up', () => goUp(navigableKeys, position))
    .with('down', () => goDown(navigableKeys, position))
    .with('next', () => goNext(navigableKeys, position))
    .with('previous', () => goPrevious(navigableKeys, position))
    .exhaustive();
};
