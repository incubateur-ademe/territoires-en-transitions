import Header from '@codegouvfr/react-dsfr/Header';
import Image from 'next/image';

function Brand() {
  return <div className="fr-header__brand fr-enlarge-link">
    <div className="fr-header__brand-top">
      <div className=""><a href="/" title="Territoires en Transitions">
        <p className="fr-logo">République<br />Française</p></a>
      </div>
      <div className="fr-header__ademe">
        <Image src="/ademe.jpg" alt="ADEME" width="70" height="80" />
        <Image src="/territoire-engage.jpg" alt="ADEME" width="80" height="80" />
      </div>
      <div className="fr-header__service"><a href="/" title="Accueil"><p
        className="fr-header__service-title pointer-events-auto">Territoires
        en Transitions</p></a><p className="text-sm">Accompagner la
        transition écologique des collectivités</p></div>
    </div>
  </div>;
}

function Tools() {
  return <div className="fr-header__tools">
    <div className="fr-header__tools-links">
      <ul className="fr-btns-group">
        <li>
          <a href="https://app.territoiresentransitions.fr/auth/signup"
             className="fr-btn fr-icon-add-circle-line">Créer
            un compte</a>
        </li>
        <li>
          <a href="https://app.territoiresentransitions.fr/auth/signin"
             className="fr-btn fr-icon-account-line">Se connecter</a>
        </li>
      </ul>
    </div>
  </div>;
}

function Menu() {
  return <div className="fr-header__menu fr-modal"
              id="modal-:S2:"
              data-fr-js-modal="true"
              data-fr-js-header-modal="true">
    <div className="fr-container">
      <button className="fr-btn--close fr-btn"
              aria-controls="modal-:S2:"
              title="Fermer"
              data-fr-js-modal-button="true">
        Fermer
      </button>

      <div className="fr-header__menu-links">
        <ul className="fr-btns-group"></ul>
      </div>

      <nav className="fr-nav" role="navigation" aria-label="Menu principal"
           data-fr-js-navigation="true">
        <ul className="fr-nav__list">
          <li className="fr-nav__item" data-fr-js-navigation-item="true"><a
            href="/stats" target="_self" className="fr-nav__link">Statistiques
            publiques</a>
          </li>
        </ul>
      </nav>

    </div>
  </div>;
}

const AppHeader = () => (
  <header role="banner" className="fr-header">
    <div className="fr-header__body">
      <div className="fr-container">
        <div className="fr-header__body-row">
          <Brand />
          <Tools />
        </div>
      </div>
    </div>
    <Menu />
  </header>
);

export default AppHeader;
