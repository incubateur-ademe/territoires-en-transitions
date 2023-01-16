'use client'; // pour utiliser `usePathname`

import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {ReactNode} from 'react';

type MenuItemProps = {
  children : ReactNode,
  href : string
};

function MenuItem(props: MenuItemProps) {
  const {href, children} = props;
  const pathName = usePathname();
  return (
    <li className="fr-nav__item">
      <Link
        href={href}
        target="_self"
        aria-controls="modal-header__menu"
        className="fr-nav__link"
        aria-current={href === pathName ? "page" : undefined}
      >
        {children}
      </Link>
    </li>
  );
}

export function MenuPrincipal() {
  return (
    <ul className="fr-nav__list">
      <MenuItem href="/stats">
        Statistiques
      </MenuItem>
    </ul>
  );
}
