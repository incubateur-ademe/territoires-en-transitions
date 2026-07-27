import { match } from 'ts-pattern';
import { toDisplayRows } from '../grid-model';
import { generateNavCellKey, GridRowGroup, NavCellKey, Year, ValeurField } from '../types';

export type NavDirection = 'up' | 'down' | 'next' | 'previous';

const VALUE_FIELDS: readonly ValeurField[] = ['resultat', 'objectif'];

export const buildNavigableKeys = ({
  groups,
  years,
}: {
  groups: GridRowGroup[];
  years: Year[];
}): NavCellKey[][] =>
  toDisplayRows(groups).map((displayRow) =>
    years.flatMap((year) =>
      VALUE_FIELDS.map((field) =>
        generateNavCellKey(displayRow.indicateurId, year, field)
      )
    )
  );

type CellPosition = { row: number; col: number };

const findCellPosition = (
  navigableKeys: NavCellKey[][],
  key: NavCellKey
): CellPosition | null => {
  const row = navigableKeys.findIndex((rowKeys) => rowKeys.includes(key));
  if (row === -1) {
    return null;
  }
  return { row, col: navigableKeys[row].indexOf(key) };
};

const goUp = (
  navigableKeys: NavCellKey[][],
  { row, col }: CellPosition
): NavCellKey | null => navigableKeys[row - 1]?.[col] ?? null;

const goDown = (
  navigableKeys: NavCellKey[][],
  { row, col }: CellPosition
): NavCellKey | null => navigableKeys[row + 1]?.[col] ?? null;

const goNext = (
  navigableKeys: NavCellKey[][],
  { row, col }: CellPosition
): NavCellKey | null => {
  const nextInRow = navigableKeys[row][col + 1];
  if (nextInRow !== undefined) {
    return nextInRow;
  }
  return navigableKeys[row + 1]?.[0] ?? null;
};

const goPrevious = (
  navigableKeys: NavCellKey[][],
  { row, col }: CellPosition
): NavCellKey | null => {
  const previousInRow = navigableKeys[row][col - 1];
  if (previousInRow !== undefined) {
    return previousInRow;
  }
  const previousRow = navigableKeys[row - 1];
  return previousRow?.[previousRow.length - 1] ?? null;
};

export const getNextNavKey = (
  navigableKeys: NavCellKey[][],
  fromKey: NavCellKey,
  direction: NavDirection
): NavCellKey | null => {
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
