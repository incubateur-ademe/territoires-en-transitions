import {Ref, forwardRef} from 'react';
import {InputBase, InputBaseProps} from './InputBase';
import {InputDate, InputDateProps} from './InputDate';
import {InputSearch, InputSearchProps} from './InputSearch';
import {InputPassword, InputPasswordProps} from './InputPassword';
import {InputNumber, InputNumberProps} from './InputNumber';
import {InputPattern, InputPatternProps} from './InputPattern';
import {InputOTP, InputOTPProps} from './InputOTP';
import {InputTel, InputTelProps} from './InputTel';
import {InputFile, InputFileProps} from './InputFile';

type InputProps =
  | (Omit<InputBaseProps, 'type'> & {type: 'text'})
  | (InputNumberProps & {type: 'number'})
  | (InputDateProps & {type: 'date'})
  | (InputSearchProps & {type: 'search'})
  | (InputPasswordProps & {type: 'password'})
  | (InputPatternProps & {type: 'pattern'})
  | (InputTelProps & {type: 'tel'})
  | (InputOTPProps & {type: 'otp'})
  | (InputFileProps & {type: 'file'});

/**
 * Affiche un champ de saisie, éventuellement combiné à une zone d'icône (ou de
 * texte) à droite du champ.
 * Toutes les props de l'élément HTML `input` sont acceptées à l'exception des changements suivants :
 * - type : restreint à un sous-ensemble des types standards
 */
export const Input = forwardRef(
  ({type = 'text', ...props}: InputProps, ref?: Ref<HTMLInputElement>) => {
    if (type === 'date') {
      return <InputDate {...(props as InputDateProps)} ref={ref} />;
    }

    if (type === 'search') {
      return <InputSearch {...(props as InputSearchProps)} ref={ref} />;
    }

    if (type === 'password') {
      return <InputPassword {...(props as InputPasswordProps)} ref={ref} />;
    }

    if (type === 'number') {
      return <InputNumber {...(props as InputNumberProps)} ref={ref} />;
    }

    if (type === 'pattern') {
      return <InputPattern {...(props as InputPatternProps)} ref={ref} />;
    }

    if (type === 'otp') {
      return <InputOTP {...(props as InputOTPProps)} ref={ref} />;
    }

    if (type === 'tel') {
      return <InputTel {...(props as InputTelProps)} ref={ref} />;
    }

    if (type === 'file') {
      return <InputFile {...(props as InputFileProps)} ref={ref} />;
    }

    return <InputBase {...(props as InputBaseProps)} ref={ref} />;
  }
);
Input.displayName = 'Input';