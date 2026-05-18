import {
  CellKey,
  generateCellKey,
  GridCell,
  IndicateurId,
  Year,
} from './types';

export const columnHasValues = ({
  cells,
  year,
  indicateurIds,
}: {
  cells: Map<CellKey, GridCell>;
  year: Year;
  indicateurIds: readonly IndicateurId[];
}): boolean =>
  indicateurIds.some((indicateurId) => {
    const cell = cells.get(generateCellKey(indicateurId, year));
    if (cell === undefined) {
      return false;
    }
    return cell.resultat !== null || cell.objectif !== null;
  });
