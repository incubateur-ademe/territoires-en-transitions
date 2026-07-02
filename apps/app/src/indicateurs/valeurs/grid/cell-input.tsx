import { Input } from '@tet/ui';
import { JSX } from 'react';
import { CellKey } from './types';

type CellInputProps = {
  cellId: CellKey;
  value: string;
  ariaLabel: string;
  hasError: boolean;
  onChange: (raw: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const CellInput = ({
  cellId,
  value,
  ariaLabel,
  hasError,
  onChange,
  onSave,
  onCancel,
}: CellInputProps): JSX.Element => (
  <Input
    type="text"
    inputMode="decimal"
    data-cell-id={cellId}
    aria-label={ariaLabel}
    aria-invalid={hasError}
    displaySize="sm"
    state={hasError ? 'error' : undefined}
    value={value}
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
    containerClassname="w-full h-full"
    className="text-right"
  />
);
