import {InputBase, InputBaseProps} from './InputBase';
import {InputDate, InputDateProps} from './InputDate';
import {InputSearch, InputSearchProps} from './InputSearch';
import {InputPassword, InputPasswordProps} from './InputPassword';

type InputProps =
  | (Omit<InputBaseProps, 'type'> & {type: 'text'})
  | (InputDateProps & {type: 'date'})
  | (InputSearchProps & {type: 'search'})
  | (InputPasswordProps & {type: 'password'});

/**
 * Affiche un champ de saisie, éventuellement combiné à une zone d'icône (ou de
 * texte) à droite du champ.
 * Toutes les props de l'élément HTML `input` sont acceptées à l'exception des changements suivants :
 * - type : restreint à un sous-ensemble des types standards
 * - size : utilisé pour indiquer la variante de taille et rester cohérent avec les autres compo du DS
 */
export const Input = ({type = 'text', ...props}: InputProps) => {
  if (type === 'date') {
    return <InputDate {...props} />;
  }

  if (type === 'search') {
    return <InputSearch {...(props as InputSearchProps)} />;
  }

  if (type === 'password') {
    return <InputPassword {...props} />;
  }

  return <InputBase type={type} {...props} />;
};
