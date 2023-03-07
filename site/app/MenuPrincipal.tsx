'use client'; // pour utiliser `usePathname`

import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {ReactNode} from 'react';
import useSWR from 'swr';
import {supabase} from './initSupabase';

const useAllRegions = () => {
  return useSWR('region', async () => {
    const {data, error} = await supabase.from('region').select();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return data;
  });
};

type MenuItemProps = {
  children: ReactNode;
  href: string;
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
        aria-current={href === pathName ? 'page' : undefined}
      >
        {children}
      </Link>
    </li>
  );
}

type MenuDropdownProps = {
  children: ReactNode;
  href: string;
  options: {code: string | null; libelle: string | null}[];
};

const MenuDropdown = ({children, href, options}: MenuDropdownProps) => {
  const pathName = usePathname();
  const pathNameBase = pathName
    ?.split('/')
    .splice(0, pathName?.split('/').length - 1)
    .join('/');

  return (
    <li className="fr-nav__item">
      <button
        className="fr-nav__btn"
        aria-expanded="false"
        aria-controls={`menu-${href}`}
        aria-current={href === pathNameBase ? 'page' : undefined}
      >
        {children}
      </button>
      <div className="fr-collapse fr-menu" id={`menu-${href}`}>
        <ul className="fr-menu__list">
          {options.map(opt => (
            <li key={opt.code}>
              <Link
                href={`${href}/${opt.code}`}
                target="_self"
                aria-controls="modal-header__menu"
                className="fr-nav__link"
              >
                {opt.libelle}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
};

export function MenuPrincipal() {
  const {data: regions} = useAllRegions();

  return (
    <ul className="fr-nav__list">
      <MenuItem href="/stats">Statistiques</MenuItem>
      <MenuDropdown href="/stats/region" options={regions ?? []}>
        Statistiques régionales
      </MenuDropdown>
    </ul>
  );
}
