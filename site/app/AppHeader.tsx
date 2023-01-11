import Header from '@codegouvfr/react-dsfr/Header';
import Image from 'next/image';

function Brand() {
  return <div className="fr-header__brand-top">
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
        <Image src="/territoire-engage.jpg" alt="ADEME" width="80"
               height="80" />
      </div>
    </div>
    <div className="fr-header__navbar">
      <button data-fr-opened="false"
              aria-controls="modal-header__menu" aria-haspopup="menu"
              id="button-861" title="Menu"
              className="fr-btn--menu fr-btn">
        Menu
      </button>
    </div>
  </div>;
}

function Links() {
  return <ul className="fr-btns-group">
    <li>
      <a href="https://app.territoiresentransitions.fr/auth/signup"
         className="fr-btn fr-icon-add-circle-line">
        Créer un compte
      </a>
    </li>
    <li>
      <a href="https://app.territoiresentransitions.fr/auth/signin"
         className="fr-btn fr-icon-account-line">
        Se connecter
      </a>
    </li>
  </ul>;
}

function Items() {
  return <ul className="fr-nav__list">
    <li className="fr-nav__item">
      <a href="/stats"
         target="_self"
         aria-controls="modal-header__menu"
         className="fr-nav__link">
        Statistiques publiques
      </a>
    </li>
  </ul>;
}

function Body() {
  return <div className="fr-header__body">
    <div className="fr-container">
      <div className="fr-header__body-row">
        <div className="fr-header__brand fr-enlarge-link">
          <Brand />
          <div className="fr-header__service">
            <a href="/" aria-current="page"
               title="Accueil - Système de Design de l'État"
               className="router-link-exact-active router-link-active">
              <p className="fr-header__service-title">
                Territoires en Transitions
                <br />
                <span style={{fontSize: 'small', fontWeight: 'normal'}}>
                Accompagner la transition écologique des collectivités
              </span>
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
  </div>;
}

function Menu() {
  return <div id="modal-header__menu" aria-labelledby="button-861"
              className="fr-header__menu fr-modal">
    <div className="fr-container">
      <button aria-controls="modal-header__menu"
              className="fr-btn fr-btn--close">
        Fermer
      </button>
      <div className="fr-header__menu-links">
        <Links />
      </div>
      <nav id="navigation-866" role="navigation" aria-label="Menu principal"
           className="fr-nav">
        <Items />
      </nav>
    </div>
  </div>;
}

const AppHeader = () => (
  <header role="banner" id="header-navigation" className="fr-header">
    <Body />
    <Menu />
  </header>
);

export default AppHeader;
