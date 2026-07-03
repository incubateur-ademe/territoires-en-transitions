import { ColumnSelection } from './open-data-picker/open-data-picker';
import { IndicateurId, Year } from './types';

export type GridCellProps = {
  secteur: string;
  polluant: string;
  indicateurId: IndicateurId;
  year: Year;
  columnSelection?: ColumnSelection;
  variationToReferenceYear: number | null;
};
