import '@gouvfr/dsfr/dist/css/header.css';
import '@gouvfr/dsfr/dist/css/logo.css';
import '@gouvfr/dsfr/dist/css/links.css';
import '@gouvfr/dsfr/dist/css/navigation.css';

import {useReadOnly} from 'core-logic/hooks/readOnly';
import {EpciNavigation, Navigation} from 'app/Navigation';
import {useParams} from 'react-router-dom';

export const Header = () => {
  const readOnly = useReadOnly();
  const {epciId} = useParams<{epciId: string}>();
  const isEpciRoute = !!epciId;

  return (
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
            {readOnly && (
              <div className="absolute h-8 px-4 top-0 right-0 bg-yellow-400">
                <p>lecture seule</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fr-header__menu fr-modal">
        <div className="fr-container">{isEpciRoute && <EpciNavigation />}</div>
      </div>
    </header>
  );
};
