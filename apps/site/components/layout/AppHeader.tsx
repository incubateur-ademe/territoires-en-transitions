'use client';

import { getAuthPaths } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import {
  AnchorButtonProps,
  Button,
  TerritoiresEnTransitionsLogo,
} from '@tet/ui';
import classNames from 'classnames';
import Link from 'next/dist/client/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Dispatch, SetStateAction, useState } from 'react';
import { MenuPrincipal } from './MenuPrincipal';

export type MenuProps = {
  menuOpened: boolean;
  setMenuOpened: Dispatch<SetStateAction<boolean>>;
};

function Brand({ menuOpened, setMenuOpened }: MenuProps) {
  return (
    <div className="fr-header__brand-top">
      <div className="fr-header__logo md:max-xl:p-2 md:max-xl:!mr-0">
        <p className="fr-logo">
          République
          <br />
          Française
        </p>
      </div>
      <div className="fr-header__operator md:max-xl:p-2 md:max-xl:!mr-0">
        <div className="fr-grid-row" style={{ minWidth: 160 + 'px' }}>
          <Image src="/ademe.jpg" alt="ADEME" width="70" height="80" />
          <Image
            src="/territoire-engage.jpg"
            alt="ADEME"
            width="80"
            height="80"
          />
          <TerritoiresEnTransitionsLogo className="h-14 m-auto" />
        </div>
      </div>
      <div className="fr-header__navbar">
        <button
          data-fr-opened={menuOpened}
          aria-controls="modal-header__menu"
          aria-haspopup="menu"
          id="button-861"
          title="Menu"
          className="fr-btn--menu fr-btn"
          onClick={() => setMenuOpened((prevState) => !prevState)}
        >
          Menu
        </button>
      </div>
    </div>
  );
}

function Links() {
  const authPaths = getAuthPaths(ENV.app_url ?? '');
  const pathName = usePathname();
  const isFAQ = pathName.startsWith('/faq');

  const SecondaryLink = ({ children, ...props }: AnchorButtonProps) => (
    <Button
      className="py-1.5 px-2"
      variant="white"
      size="sm"
      iconPosition="left"
      {...props}
    >
      {children}
    </Button>
  );

  return (
    <ul className="flex items-center gap-2">
      <li>
        <SecondaryLink
          href="/faq"
          icon={isFAQ ? 'question-fill' : 'question-line'}
        >
          FAQ
        </SecondaryLink>
      </li>
      <li>
        <SecondaryLink href={authPaths?.signUp} external icon="add-circle-line">
          Créer un compte
        </SecondaryLink>
      </li>
      <li>
        <SecondaryLink
          href={authPaths?.login}
          external
          icon="account-circle-line"
        >
          Se connecter
        </SecondaryLink>
      </li>
    </ul>
  );
}

function Body(props: MenuProps) {
  return (
    <div className="fr-header__body">
      <div className="fr-container">
        <div className="fr-header__body-row">
          <div className="fr-header__brand fr-enlarge-link">
            <Link
              href="/"
              aria-current="page"
              title="Accueil - Territoires en Transitions"
              className="router-link-exact-active router-link-active"
            >
              <Brand {...props} />
            </Link>
          </div>
          <div className="fr-header__tools md:max-xl:pr-0 md:max-xl:pl-1">
            <div className="fr-header__tools-links">
              <Links />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Menu({ menuOpened, setMenuOpened }: MenuProps) {
  return (
    <div
      id="modal-header__menu"
      aria-labelledby="button-861"
      className={classNames('fr-header__menu fr-modal', {
        'fr-modal--opened': menuOpened,
      })}
      role={menuOpened ? 'dialog' : undefined}
    >
      <div className="fr-container">
        <button
          aria-controls="modal-header__menu"
          className="fr-btn fr-btn--close"
          onClick={() => setMenuOpened(false)}
        >
          Fermer
        </button>
        <div className="fr-header__menu-links">
          <Links />
        </div>
        <nav
          id="navigation-866"
          role="navigation"
          aria-label="Menu principal"
          className="fr-nav"
        >
          <MenuPrincipal {...{ menuOpened, setMenuOpened }} />
        </nav>
      </div>
    </div>
  );
}

const AppHeader = () => {
  const [menuOpened, setMenuOpened] = useState(false);

  return (
    <header role="banner" id="header-navigation" className="fr-header">
      <Body {...{ menuOpened, setMenuOpened }} />
      <Menu {...{ menuOpened, setMenuOpened }} />
    </header>
  );
};

export default AppHeader;
