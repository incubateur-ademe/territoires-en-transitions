import { ComponentType, Ref, forwardRef } from 'react';
import { InputBase, InputBaseProps } from './InputBase';
import { InputPattern, InputPatternProps } from './InputPattern';
import { validateInputNumLength } from './validateInputNumLength';

export type InputOTPProps = Omit<
  InputPatternProps,
  'format' | 'mask' | 'allowEmptyFormatting'
> &
  Pick<InputBaseProps, 'containerClassname'>;

const LENGTH = 6; // longueur du code attendu
const FORMAT = new Array(LENGTH).fill('#').join(' '); // formatage du code lors de la saisie

// renvoi le code saisi si il est valide
export const validateOTP = (value: string) =>
  validateInputNumLength(value, LENGTH);

/**
 * Affiche un champ de saisie d'un code OTP (6 chiffres)
 *
 * La saisie des caractères non valides est ignorée.
 * La valeur est formatée automatiquement suivant le format donné.
 * `onValidChange` est appelée si la saisie est correcte et fourni le code sans le formatage.
 */
export const InputOTP = forwardRef(
  (
    { value, ...remainingProps }: InputOTPProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    return (
      <InputPattern
        className="w-32 text-lg text-center"
        customInput={InputBase as ComponentType}
        getInputRef={ref}
        value={value}
        format={FORMAT}
        mask="_"
        allowEmptyFormatting
        {...remainingProps}
      />
    );
  }
);
