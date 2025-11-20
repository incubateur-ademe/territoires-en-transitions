import { DEPRECATED_TCell } from '@tet/ui';
import { useDebouncedCallback } from 'use-debounce';
import { InputValue } from './input-value';

// pour formater les chiffres
export const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

type CellValueProps = {
  value: number | '';
  readonly?: boolean;
  onChange?: (value: number | null) => void;
};

// Affiche une cellule du tableau (chiffre ou champ de saisie)
export const CellValue = (props: CellValueProps) => {
  const { readonly, onChange } = props;
  return !readonly && onChange ? (
    <CellValueInput {...props} />
  ) : (
    <CellValueReadOnly {...props} />
  );
};

const CellValueReadOnly = ({ value }: CellValueProps) => {
  return (
    <DEPRECATED_TCell variant="number">
      {typeof value === 'number' ? NumFormat.format(value) : ''}
    </DEPRECATED_TCell>
  );
};

const CellValueInput = ({ value, onChange }: CellValueProps) => {
  const handleChange = useDebouncedCallback(onChange ?? (() => void 0), 500);
  return (
    <DEPRECATED_TCell variant="input">
      <InputValue displaySize="sm" value={value} onChange={handleChange} />
    </DEPRECATED_TCell>
  );
};
