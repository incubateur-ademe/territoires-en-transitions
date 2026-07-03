import { findCell } from '../grid-model';
import { CellKey, GridCell, IndicateurId, Year } from '../types';

export const computeVariation = ({
  value,
  referenceValue,
}: {
  value: number;
  referenceValue: number | null;
}): number | null => {
  if (referenceValue === null || referenceValue === 0) {
    return null;
  }
  return (value - referenceValue) / referenceValue;
};

export const resolveVariationToReferenceYear = ({
  cell,
  cells,
  indicateurId,
  year,
  referenceYear,
}: {
  cell: GridCell | null;
  cells: Map<CellKey, GridCell>;
  indicateurId: IndicateurId;
  year: Year;
  referenceYear: Year | null;
}): number | null => {
  if (referenceYear === null) {
    return null;
  }
  const isObjective = year > referenceYear;
  if (!isObjective) {
    return null;
  }
  if (cell === null || cell.value === null) {
    return null;
  }
  const referenceCell = findCell({ cells, indicateurId, year: referenceYear });
  return computeVariation({
    value: cell.value,
    referenceValue: referenceCell?.value ?? null,
  });
};

const signPrefix = (percent: number): string => {
  if (percent > 0) {
    return '+';
  }
  if (percent < 0) {
    return '-';
  }
  return '';
};

const NARROW_NO_BREAK_SPACE = String.fromCharCode(0x202f);

export const formatVariation = (ratio: number): string => {
  const percent = Math.round(ratio * 1000) / 10;
  const magnitude = Math.abs(percent).toString().replace('.', ',');
  return `${signPrefix(percent)}${magnitude}${NARROW_NO_BREAK_SPACE}%`;
};
