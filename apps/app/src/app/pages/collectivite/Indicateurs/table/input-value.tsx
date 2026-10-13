import { Input } from '@tet/ui';

type InputValueProps = {
  id?: string;
  className?: string;
  value: number | '';
  disabled?: boolean;
  onChange?: (value: number | null) => void;
};

/**
 * Affiche un champ pour la saisie d'une valeur numérique
 */
export const InputValue = (props: InputValueProps) => {
  const { id, className, disabled, value, onChange } = props;
  return (
    <Input
      id={id}
      className={className}
      disabled={disabled}
      type="number"
      numType="float"
      value={value?.toString() ?? ''}
      onChange={(e) => {
        const parsedValue = parseFloat(
          e.currentTarget.value.trim().replaceAll(',', '.').replaceAll(' ', '')
        );
        const newValue = Number.isFinite(parsedValue) ? parsedValue : null;
        if (newValue !== (value ?? null)) {
          onChange?.(newValue);
        }
      }}
    />
  );
};
