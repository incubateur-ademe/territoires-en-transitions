'use client';

import Image from 'next/image';
import {MenuPrincipal} from './MenuPrincipal';
import {Dispatch, SetStateAction, useEffect, useState} from 'react';
import classNames from 'classnames';
import {getAuthPaths, getAppBaseUrl} from '@tet/api';

export type MenuProps = {
  menuOpened: boolean;
  setMenuOpened: Dispatch<SetStateAction<boolean>>;
};

function Brand({menuOpened, setMenuOpened}: MenuProps) {
  return (
    <div className="fr-header__brand-top">
      <div className="fr-header__logo">
        <p className="fr-logo">
          République
          <br />
          Française
        </p>
      </div>
      <div className="fr-header__operator">
        <div className="fr-grid-row" style={{minWidth: 160 + 'px'}}>
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
          onClick={() => setMenuOpened(prevState => !prevState)}
        >
          Menu
        </button>
      </div>
    </div>
  );
}

function Links() {
  const [authPaths, setAuthPaths] = useState<null | ReturnType<
    typeof getAuthPaths
  >>(null);
  useEffect(() => {
    setAuthPaths(
      getAuthPaths(document.location.hostname, getAppBaseUrl(document.location.hostname)),
    );
  }, []);

  return (
    <ul className="fr-btns-group">
      <li>
        <a href={authPaths?.signUp} className="fr-btn fr-icon-add-circle-line">
          Créer un compte
        </a>
      </li>
      <li>
        <a href={authPaths?.login} className="fr-btn fr-icon-account-line">
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
            <div className="fr-header__service max-md:text-center">
              <a
                href="/"
                aria-current="page"
                title="Accueil - Territoires en Transitions"
                className="router-link-exact-active router-link-active"
              >
                <p className="fr-header__service-title mb-0 text-primary-8 text-[20px] md:text-[25px]">
                  Territoires en Transitions
                </p>
                <p className="fr-header__service-tagline mb-0 text-grey-8 text-[14px] md:text-[13px] font-[500]">
                  Accompagner la transition écologique des collectivités
                </p>
              </a>
            </div>
          </div>
          <div className="fr-header__tools">
            <div className="fr-header__tools-links">
              <Links />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Menu({menuOpened, setMenuOpened}: MenuProps) {
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
          <MenuPrincipal {...{menuOpened, setMenuOpened}} />
        </nav>
      </div>
    </div>
  );
}

const AppHeader = () => {
  const [menuOpened, setMenuOpened] = useState(false);

  return (
    <header role="banner" id="header-navigation" className="fr-header">
      <Body {...{menuOpened, setMenuOpened}} />
      <Menu {...{menuOpened, setMenuOpened}} />
    </header>
  );
};

export default AppHeader;
