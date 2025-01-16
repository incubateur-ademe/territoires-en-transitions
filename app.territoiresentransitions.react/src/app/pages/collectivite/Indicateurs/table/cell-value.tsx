import { TCell } from '@/ui';
import { InputValue } from './input-value';

// pour formater les chiffres
export const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

type CellValueProps = {
  value: number | '';
  readonly?: boolean;
  onChange?: (value: number | null) => void;
};

// Affiche une cellule du tableau (chiffre ou champ de saisie)
export const CellValue = ({ value, readonly, onChange }: CellValueProps) => {
  return (
    <TCell variant={readonly ? 'number' : 'input'}>
      {readonly ? (
        typeof value === 'number' ? (
          NumFormat.format(value)
        ) : (
          ''
        )
      ) : (
        <InputValue displaySize="sm" value={value} onChange={onChange} />
      )}
    </TCell>
  );
};
