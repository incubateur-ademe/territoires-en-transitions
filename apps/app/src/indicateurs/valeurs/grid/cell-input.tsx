import { cn } from '@tet/ui';
import { JSX } from 'react';
import { CellKey } from './types';

type CellInputProps = {
  cellId: CellKey;
  value: string;
  ariaLabel: string;
  describedById?: string;
  hasError: boolean;
  onChange: (raw: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const CellInput = ({
  cellId,
  value,
  ariaLabel,
  describedById,
  hasError,
  onChange,
  onSave,
  onCancel,
}: CellInputProps): JSX.Element => (
  <input
    type="text"
    inputMode="decimal"
    data-cell-id={cellId}
    aria-label={ariaLabel}
    aria-describedby={describedById}
    aria-invalid={hasError}
    value={value}
    size={Math.max(value.length, 2)}
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
    className={cn(
      'min-w-[3ch] rounded bg-transparent px-0.5 py-1 text-right text-sm text-grey-8 outline-none [field-sizing:content] focus:ring-2 focus:ring-inset focus:ring-primary-5',
      hasError && 'text-error-1 ring-2 ring-inset ring-error-1'
    )}
  />
);
