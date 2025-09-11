import { IconValue } from '@/ui/design-system/Icon';
import { ButtonHTMLProps, LinkFullProps } from '@/ui/utils/types';
import { NotificationProps } from '../Notification';

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
  /** Affiche un loader à la place de l'icône */
  loading?: boolean;
  /** Désactive les interractions avec le bouton */
  disabled?: boolean;
  /** À donner pour afficher une notification */
  notification?: NotificationProps;
};

type BaseButtonProps = {
  /** Position de l'icône dans le bouton */
  iconPosition?: IconPosition;
  /** Lien externe */
  external?: boolean;
  /** Donné par le dropdownfloater si utilisé pour afficher un élément floating-ui */
  isOpen?: boolean;
  dataTest?: string;
} & ButtonContentProps;

// On définit les types des props du composant <Button>
export type DefaultButtonProps = BaseButtonProps & ButtonHTMLProps;
export type AnchorButtonProps = BaseButtonProps & LinkFullProps;

/** Props données au composant générique <Button> */
export type ButtonProps = DefaultButtonProps | AnchorButtonProps;
