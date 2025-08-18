import { HeaderPropsWithModalState } from '@/app/app/Layout/Header/types'; // TODO : Modifier
import { cn } from '@/ui/utils/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

type MenuItemProps = {
  children: ReactNode;
  href: string;
  external?: boolean;
  setModalOpened: (opened: boolean) => void;
};

function MenuItem(props: MenuItemProps) {
  const { href, children, external, setModalOpened } = props;
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
        onClick={() => setModalOpened(false)}
      >
        {children}
      </Link>
    </li>
  );
}

export const MenuPrincipal = (props: HeaderPropsWithModalState) => {
  const { modalOpened } = props;

  return (
    <nav
      className={cn('fr-nav flex', {
        'flex-col': modalOpened,
      })}
      style={{
        /**
         * Useful to override default justify-content: space-between
         */
        justifyContent: 'space-between',
      }}
      role="navigation"
      aria-label="Menu principal"
    >
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
    </nav>
  );
};
