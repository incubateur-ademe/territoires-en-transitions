import { Input } from '@tet/ui';
import { JSX } from 'react';

type CellInputProps = {
  value: number | null;
  ariaLabel: string;
  describedById?: string;
  hasError: boolean;
  withNavigationId?: boolean;
  onChange: (raw: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const CellInput = ({
  value,
  ariaLabel,
  describedById,
  hasError,
  onChange,
  onSave,
  onCancel,
}: CellInputProps): JSX.Element => (
  <Input
    type="number"
    inputMode="decimal"
    autoFocus
    aria-label={ariaLabel}
    aria-describedby={describedById}
    aria-invalid={hasError}
    value={value?.toString() ?? ''}
    // size={Math.max((value ?? '').length, 2)}
    onFocus={(event) => event.currentTarget.select()}
    onChange={(event) => onChange(event.currentTarget.value)}
    onBlur={onSave}
    onKeyDown={(event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onSave();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }}
  />
);
