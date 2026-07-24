import { IndicateurId, Year } from './types';

export type GridCellProps = {
  groupLabel: string;
  rowLabel: string;
  indicateurId: IndicateurId;
  year: Year;
  variationToReferenceYear: number | null;
};
