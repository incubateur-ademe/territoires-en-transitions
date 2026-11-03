import { TableCell } from '@tet/ui';

// pour formater les chiffres
const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

type CellValueProps = {
  value: number | '';
};

// Affiche une valeur du tableau en lecture seule.
export const CellValue = ({ value }: CellValueProps) => {
  return (
    <TableCell className="text-center font-bold text-primary-8">
      {typeof value === 'number' ? NumFormat.format(value) : ''}
    </TableCell>
  );
};
