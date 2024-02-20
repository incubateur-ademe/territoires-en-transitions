import {Ref, forwardRef} from 'react';
import {InputBase} from './InputBase';
import {
  InputPattern,
  InputPatternProps,
} from '@design-system/Input/InputPattern';

export type InputOTPProps = Omit<
  InputPatternProps,
  'format' | 'mask' | 'allowEmptyFormatting'
> & {
  /** Appelée avec la valeur non formatée lorsque la saisie est correcte */
  onValidChange: (value: string) => void;
};

const RE_CLEAN = /[^\d]/g; // pour supprimer les caractères non numériques
const LENGTH = 6; // longueur du code attendu
const FORMAT = new Array(LENGTH).fill('#').join(' '); // formatage du code lors de la saisie

// renvoi le code saisi si il est valide
const validate = (value: string) => {
  // nettoie le code saisi
  const v = value.replace(RE_CLEAN, '');
  // et le renvoi si la longueur est celle attendue
  return v.length === LENGTH ? v : false;
};

/**
 * Affiche un champ de saisie d'un code OTP (6 chiffres)
 *
 * La saisie des caractères non valides est ignorée.
 * La valeur est formatée automatiquement suivant le format donné.
 * `onValidChange` est appelée si la saisie est correcte et fourni le code sans le formatage.
 */
export const InputOTP = forwardRef(
  (
    {value, onChange, onValidChange, ...remainingProps}: InputOTPProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    return (
      <InputPattern
        className="w-32 text-lg text-center"
        customInput={InputBase}
        getInputRef={ref}
        value={value}
        format={FORMAT}
        mask="_"
        allowEmptyFormatting
        onChange={e => {
          const value = e.target.value;
          const v = validate(value);
          onChange?.(e);
          if (v) {
            onValidChange(v);
          }
        }}
        {...remainingProps}
      />
    );
  }
);
