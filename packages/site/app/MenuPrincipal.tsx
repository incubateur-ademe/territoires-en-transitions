/* eslint-disable react/no-unescaped-entities */
'use client'; // pour utiliser `usePathname`

import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {ReactNode} from 'react';
import {MenuProps} from './AppHeader';

type MenuItemProps = {
  children: ReactNode;
  href: string;
} & MenuProps;

function MenuItem(props: MenuItemProps) {
  const {href, children, setMenuOpened} = props;
  const pathName = usePathname();
  const pathNameBase = pathName?.split('/').splice(0, 2).join('/');

  return (
    <li className="fr-nav__item">
      <Link
        href={href}
        target="_self"
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
        Le programme Territoire Engagé
      </MenuItem>
      <MenuItem href="/outil-numerique" {...props}>
        L'outil numérique
      </MenuItem>
      <MenuItem href="/actus" {...props}>
        Actualités
      </MenuItem>
      <MenuItem href="/faq" {...props}>
        Questions fréquentes
      </MenuItem>
      <MenuItem href="/stats" {...props}>
        Statistiques
      </MenuItem>
      <MenuItem href="/contact" {...props}>
        Contact
      </MenuItem>
    </ul>
  );
}
