import { LinkProps } from 'next/link';
import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
} from 'react';

/** Propriétés HTML d'une div */
export type DivHTMLProps = HTMLAttributes<HTMLDivElement>;
/** Propriétés HTML d'un bouton */
export type ButtonHTMLProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  [key: `data-${string}`]: unknown;
};

/** Propriétés HTML d'un lien */
export type AnchorHTMLProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/** Props du Link de Nextjs reconstituée car non exportées entièrement */
export type LinkFullProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof LinkProps
> &
  LinkProps & {
    children?: React.ReactNode;
  } & React.RefAttributes<HTMLAnchorElement>;

/** Détermine si les proriétés appartiennent à un lien */
export function isLink(
  props: ButtonHTMLProps | LinkFullProps | DivHTMLProps
): props is LinkFullProps {
  return (props as LinkFullProps).href !== undefined;
}

/** Type générique pour la gestion d'un état d'ouverture  */
export type OpenState = {
  /** état d'ouverture */
  isOpen: boolean;
  /* accompagne "isOpen" afin de pouvoir fermer la modale */
  setIsOpen: (opened: boolean) => void;
};
