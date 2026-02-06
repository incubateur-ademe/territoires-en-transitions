import { ComponentType, Ref, forwardRef } from 'react';
import { PatternFormat, PatternFormatProps } from 'react-number-format';
import { InputBase, InputBaseProps } from './InputBase';

export type InputPatternProps = Omit<PatternFormatProps, 'type' | 'value'> & {
  value?: InputBaseProps['value'];
};

/**
 * Affiche un champ imposant un format de saisie
 *
 * La saisie des caractères non valides est ignorée.
 * La valeur est formatée automatiquement suivant le format donné.
 */
export const InputPattern = forwardRef(
  (
    { value, ...remainingProps }: InputPatternProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    return (
      <PatternFormat
        customInput={InputBase as ComponentType}
        getInputRef={ref}
        value={value}
        {...remainingProps}
      />
    );
  }
);
InputPattern.displayName = 'InputPattern';