import '@gouvfr/dsfr/dist/css/header.css';
import '@gouvfr/dsfr/dist/css/logo.css';
import '@gouvfr/dsfr/dist/css/links.css';
import '@gouvfr/dsfr/dist/css/navigation.css';

import {EpciNavigation, Navigation} from 'app/Navigation';
import {currentEpciBloc} from 'core-logic/observables';

export const Header = () => (
  <header role="banner" className="header fr-header ">
    <div className="fr-header__body">
      <div className="fr-container">
        <div className="fr-header__body-row header__row">
          <div className="fr-header__brand fr-enlarge-link">
            <div className="fr-header__brand-top">
              <div className="fr-header__logo">
                <p className="fr-logo">
                  République
                  <br /> française
                </p>
              </div>
            </div>
            <div className="fr-header__ademe">
              <img
                src="https://territoiresentransitions.fr/img/ademe.jpg"
                alt="logo ADEME"
                loading="lazy"
                className="h-20"
              />
            </div>
            <div className="fr-header__service">
              <a href="/" title="Accueil">
                <p className="fr-header__service-title">
                  Territoires en Transitions
                </p>
              </a>
            </div>
          </div>
          <Navigation />
          {currentEpciBloc.readonly && (
            <div className="absolute h-8 px-4 top-0 right-0 bg-yellow-400">
              <p>lecture seule</p>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="fr-header__menu fr-modal">
      <div className="fr-container">
        {currentEpciBloc.currentEpci !== null && (
          <div className="flex flex-row justify-between">
            <EpciNavigation />
            <div>{currentEpciBloc.currentEpci.nom}</div>
          </div>
        )}
      </div>
    </div>
  </header>
);
