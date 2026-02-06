import { ComponentType, Ref, forwardRef } from 'react';
import { PatternFormat, PatternFormatProps } from 'react-number-format';
import { InputBase, InputBaseProps } from './InputBase';
import { validateInputNumLength } from './validateInputNumLength';

export type InputTelProps = Omit<
  PatternFormatProps,
  'type' | 'value' | 'format' | 'mask' | 'allowEmptyFormatting'
> & {
  value?: InputBaseProps['value'];
};

// renvoi le numéro de tel saisi si il est valide
export const validateTel = (value: string) => validateInputNumLength(value, 10);

/**
 * Affiche un champ de saisie d'un numéro de téléphone (10 chiffres)
 *
 * La saisie des caractères non valides est ignorée.
 * La valeur est formatée automatiquement suivant le format donné.
 */
export const InputTel = forwardRef(
  (
    { value, ...remainingProps }: InputTelProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    return (
      <PatternFormat
        type="tel"
        format="## ## ## ## ##"
        customInput={InputBase as ComponentType}
        getInputRef={ref}
        value={value}
        {...remainingProps}
      />
    );
  }
);
InputTel.displayName = 'InputTel';