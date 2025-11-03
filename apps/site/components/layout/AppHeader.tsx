'use client';

import { getAuthPaths } from '@/api';
import { ENV } from '@/api/environmentVariables';
import TerritoiresEnTransitionsLogo from '@/ui/assets/territoires-en-transitions.logo';
import classNames from 'classnames';
import Image from 'next/image';
import Link from 'next/link';
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

  return (
    <ul className="fr-btns-group">
      <li>
        <a
          href="/faq"
          className={classNames('fr-btn', {
            'fr-icon-question-line': !isFAQ,
            'fr-icon-question-fill': isFAQ,
          })}
        >
          FAQ
        </a>
      </li>
      <li>
        <a
          href={authPaths?.signUp}
          target="_blank"
          rel="noopener noreferrer"
          // after:!w-0 after:!m-0 permettent de masquer l'icône
          // external ajoutée par le dsfr
          className="fr-btn fr-icon-add-circle-line after:!w-0 after:!m-0"
        >
          Créer un compte
        </a>
      </li>
      <li>
        <a
          href={authPaths?.login}
          target="_blank"
          rel="noopener noreferrer"
          // after:!w-0 after:!m-0 permettent de masquer l'icône
          // external ajoutée par le dsfr
          className="fr-btn fr-icon-account-line after:!w-0 after:!m-0"
        >
          Se connecter
        </a>
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
            <Brand {...props} />
            <div className="fr-header__service max-md:text-center md:max-xl:p-2">
              <Link
                href="/"
                aria-current="page"
                title="Accueil - Territoires en Transitions"
                className="router-link-exact-active router-link-active"
              >
                <TerritoiresEnTransitionsLogo className="h-full w-auto" />
              </Link>
            </div>
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
