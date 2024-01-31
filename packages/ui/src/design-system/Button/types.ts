import {AnchorHTMLAttributes, ButtonHTMLAttributes} from 'react';

import {IconValue} from '@design-system/Icon';

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
} & ButtonContentProps;

// On définit les types des props des éléments HTML
export type ButtonHTMLProps = ButtonHTMLAttributes<HTMLButtonElement>;
export type AnchorHTMLProps = AnchorHTMLAttributes<HTMLAnchorElement>;
type UnknownHTMLProps = ButtonHTMLProps | AnchorHTMLProps;

// On définit les types des props du composant <Button>
export type DefaultButtonProps = BaseButtonProps & ButtonHTMLProps;
type AnchorButtonProps = BaseButtonProps & AnchorHTMLProps;
/** Props données au composant générique <Button> */
export type ButtonProps = DefaultButtonProps | AnchorButtonProps;

/** Permet de déterminer si l'élément HTML est une ancre ou un bouton */
export function isAnchor(props: UnknownHTMLProps): props is AnchorHTMLProps {
  return (props as AnchorHTMLProps).href !== undefined;
}
