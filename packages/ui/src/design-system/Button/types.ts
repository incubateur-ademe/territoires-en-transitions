import {IconValue} from '@design-system/Icon';
import {AnchorHTMLProps, ButtonHTMLProps} from 'utils/types';

export type ButtonState = 'default' | 'disabled';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outlined'
  | 'white'
  | 'grey'
  | 'underlined';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'xl';

type IconPosition = 'left' | 'right';

export type ButtonContentProps = {
  /** Enfant du bouton */
  children?: React.ReactNode;
  /** Thème de couleur utilisé sur le bouton */
  variant?: ButtonVariant;
  /** Taille du bouton */
  size?: ButtonSize;
  /** Icône à intégrer au bouton, au format SVG ou avec la nomenclature Remix Icon */
  icon?: IconValue;
  /** Désactive les interractions avec le bouton */
  disabled?: boolean;
};

type BaseButtonProps = {
  /** Position de l'icône dans le bouton */
  iconPosition?: IconPosition;
  /** Lien externe */
  external?: boolean;
  /** Donné par le dropdownfloater si utilisé pour afficher un élément floating-ui */
  isOpen?: boolean;
} & ButtonContentProps;

// On définit les types des props du composant <Button>
export type DefaultButtonProps = BaseButtonProps & ButtonHTMLProps;
type AnchorButtonProps = BaseButtonProps & AnchorHTMLProps;

/** Props données au composant générique <Button> */
export type ButtonProps = DefaultButtonProps | AnchorButtonProps;
