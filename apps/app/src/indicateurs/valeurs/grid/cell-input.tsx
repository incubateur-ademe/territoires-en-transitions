import { Input } from '@tet/ui';
import { JSX } from 'react';

type CellInputProps = {
  value: string;
  ariaLabel: string;
  hasError: boolean;
  onChange: (raw: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

export const CellInput = ({
  value,
  ariaLabel,
  hasError,
  onChange,
  onCommit,
  onCancel,
}: CellInputProps): JSX.Element => (
  <Input
    type="text"
    inputMode="decimal"
    aria-label={ariaLabel}
    aria-invalid={hasError}
    displaySize="sm"
    state={hasError ? 'error' : undefined}
    value={value}
    onFocus={(event) => event.currentTarget.select()}
    onChange={(event) => onChange(event.currentTarget.value)}
    onBlur={onCommit}
    onKeyDown={(event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onCommit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }}
    containerClassname="w-full h-full"
    className="text-right"
  />
);
