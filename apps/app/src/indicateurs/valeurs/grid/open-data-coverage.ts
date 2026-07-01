import { CoveringSource, GridCell } from './types';

export const openDataSourcesFor = (cell: GridCell | null): CoveringSource[] =>
  cell !== null && cell.kind === 'user-data' ? cell.coveringSources : [];

export const isCovered = (cell: GridCell | null): boolean =>
  openDataSourcesFor(cell).length > 0;

export const countOpenDataProposals = (cells: GridCell[]): number =>
  cells.filter(
    (cell) =>
      cell.kind === 'user-data' &&
      cell.value === null &&
      cell.coveringSources.length > 0
  ).length;
