import { DEPRECATED_TCell } from '@tet/ui';

// pour formater les chiffres
const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

type CellValueProps = {
  value: number | '';
};

// Affiche une valeur du tableau en lecture seule.
export const CellValue = ({ value }: CellValueProps) => {
  return (
    <DEPRECATED_TCell variant="number">
      {typeof value === 'number' ? NumFormat.format(value) : ''}
    </DEPRECATED_TCell>
  );
};
