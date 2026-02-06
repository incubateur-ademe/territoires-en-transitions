import {
  ClipboardEvent,
  ComponentType,
  ForwardedRef,
  forwardRef,
  useEffect,
  useState,
} from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { InputBase, InputBaseProps } from './InputBase';

export type InputNumberProps = Omit<NumericFormatProps, 'type' | 'value'> & {
  value: InputBaseProps['value'];
  /** Taille d'affichage */
  displaySize?: InputBaseProps['displaySize'];
  /** Type de saisie numérique attendue */
  numType?: 'float' | 'int';
  /** Contenu optionnel pour la zone d'icône à droite du champ */
  icon?: InputBaseProps['icon'];
  /** Pour styler le container */
  containerClassname?: InputBaseProps['containerClassname'];
};

const DECIMAL_SEP = ',';
const THOUSAND_SEP = ' ';

/**
 * Affiche un champ de saisie numérique.
 *
 * La saisie des caractères non valides est ignorée.
 * La valeur est formatée automatiquement avec les séparateurs de milliers et de décimales FR.
 */
export const InputNumber = forwardRef(
  (
    {
      numType = 'int',
      defaultValue,
      value,
      ...remainingProps
    }: InputNumberProps,
    ref?: ForwardedRef<HTMLInputElement>
  ) => {
    const [currentValue, setCurrentValue] = useState(defaultValue);

    useEffect(() => {
      setCurrentValue(value);
    }, [value]);

    return (
      <NumericFormat
        customInput={InputBase as ComponentType}
        getInputRef={ref}
        thousandSeparator={THOUSAND_SEP}
        decimalSeparator={DECIMAL_SEP}
        decimalScale={numType === 'int' ? 0 : 3}
        onPaste={(e: ClipboardEvent) => {
          // rend la chaîne copiée compatible avec le `decimalSeparator` spécifié
          const data = e.clipboardData?.getData('text/plain');
          if (typeof data === 'string' && data.includes('.')) {
            e.preventDefault();
            setCurrentValue(data.replace('.', DECIMAL_SEP));
          }
        }}
        type="text"
        value={currentValue}
        {...remainingProps}
      />
    );
  }
);
InputNumber.displayName = 'InputNumber';