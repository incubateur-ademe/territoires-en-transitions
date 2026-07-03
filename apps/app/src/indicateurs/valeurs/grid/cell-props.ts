import { ColumnSelection } from './open-data-picker/open-data-picker';
import { IndicateurId, Year } from './types';

export type GridCellProps = {
  groupLabel: string;
  rowLabel: string;
  indicateurId: IndicateurId;
  year: Year;
  columnSelection?: ColumnSelection;
  variationToReferenceYear: number | null;
};
