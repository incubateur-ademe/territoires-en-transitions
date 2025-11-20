import { Input } from '@tet/ui';
import classNames from 'classnames';

export type InputValueProps = {
  className?: string;
  value: number | '';
  displaySize?: 'sm' | 'md';
  disabled?: boolean;
  onChange?: (value: number | null) => void;
};

/**
 * Affiche un champ pour la saisie d'une valeur numérique
 */
export const InputValue = (props: InputValueProps) => {
  const { className, disabled, displaySize, value, onChange } = props;
  return (
    <Input
      className={classNames(
        { 'max-w-[8.5rem]': displaySize === 'sm' },
        className
      )}
      disabled={disabled}
      displaySize={displaySize}
      type="number"
      numType="float"
      value={value?.toString() ?? ''}
      onChange={(e) => {
        const parsedValue = parseFloat(
          e.currentTarget.value.trim().replaceAll(',', '.').replaceAll(' ', '')
        );
        const newValue = isNaN(parsedValue) ? null : parsedValue;
        if (newValue !== (value ?? null)) {
          onChange?.(newValue);
        }
      }}
    />
  );
};
