/* eslint-disable react/no-unescaped-entities */
'use client'; // pour utiliser `usePathname`

import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {ReactNode} from 'react';
import {MenuProps} from './AppHeader';

type MenuItemProps = {
  children: ReactNode;
  href: string;
  external?: boolean;
} & MenuProps;

function MenuItem(props: MenuItemProps) {
  const {href, children, external, setMenuOpened} = props;
  const pathName = usePathname();
  const pathNameBase = pathName?.split('/').splice(0, 2).join('/');

  return (
    <li className="fr-nav__item">
      <Link
        href={href}
        target={external ? '_blank' : '_self'}
        rel={external ? 'noreferrer noopener' : ''}
        aria-controls="modal-header__menu"
        className="fr-nav__link"
        aria-current={href === pathNameBase ? 'page' : undefined}
        onClick={() => setMenuOpened(false)}
      >
        {children}
      </Link>
    </li>
  );
}

export function MenuPrincipal(props: MenuProps) {
  return (
    <ul className="fr-nav__list">
      <MenuItem href="/" {...props}>
        Accueil
      </MenuItem>
      <MenuItem href="/programme" {...props}>
        Programme
      </MenuItem>
      <MenuItem href="/outil-numerique" {...props}>
        Outil numérique
      </MenuItem>
      <MenuItem
        href="https://rencontres.territoiresentransitions.fr/"
        {...props}
      >
        Rencontres
      </MenuItem>
      <MenuItem href="/collectivites" {...props}>
        Collectivités
      </MenuItem>
      <MenuItem href="/actus" {...props}>
        Actualités
      </MenuItem>
      <MenuItem href="/contact" {...props}>
        Contact
      </MenuItem>
    </ul>
  );
}
