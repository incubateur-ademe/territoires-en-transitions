import {AnchorHTMLAttributes, ButtonHTMLAttributes} from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outlined'
  | 'white'
  | 'grey';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'xl';

type IconPosition = 'left' | 'right';

type CommonButtonProps = {
  /** Désactive les interractions avec le bouton */
  disabled?: boolean;
  /** Thème de couleur utilisé sur le bouton */
  variant?: ButtonVariant;
  /** Taille du bouton */
  size?: ButtonSize;
  /** Icône à intégrer au bouton, au format SVG ou avec la nomenclature Remix Icon */
  icon?: JSX.Element | ((className: string) => JSX.Element) | string;
  /** Position de l'icône dans le bouton */
  iconPosition?: IconPosition;
};

type DefaultButtonProps = CommonButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement>;

type AnchorButtonProps = {
  /** Lien externe */
  external?: boolean;
} & CommonButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export type ButtonProps = DefaultButtonProps | AnchorButtonProps;

export function isAnchorButton(props: ButtonProps): props is AnchorButtonProps {
  return (props as AnchorButtonProps).href !== undefined;
}

export function isDefaultButton(
  props: ButtonProps
): props is DefaultButtonProps {
  return !isAnchorButton(props as DefaultButtonProps);
}
