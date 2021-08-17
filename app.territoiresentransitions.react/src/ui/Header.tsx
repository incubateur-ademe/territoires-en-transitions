import 'app/DesignSystem/header.css';
import 'app/DesignSystem/logo.css';

import React from 'react';

export type HeaderProps = {
  nav: React.ReactElement;
  secondary?: React.ReactElement;
};

export const Header = (props: HeaderProps) => {
  return (
    <header role="banner" className="header fr-header">
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
              <picture>
                <source
                  src="https://territoiresentransitions.fr/img/ademe.jpg 118w"
                  sizes="118px"
                />
                <img
                  src="https://territoiresentransitions.fr/img/ademe.jpg"
                  alt="ADEME"
                  loading="lazy"
                  className="header__logo"
                />
              </picture>
            </div>
            <div className="fr-header__service">
              <a href="/" title="Accueil">
                <p className="fr-header__service-title">
                  Territoires en Transitions
                </p>
              </a>
            </div>
          </div>

          {props.nav}
        </div>
        <div
          className="fr-header__menu fr-modal"
          id="header-navigation"
          aria-labelledby="button-1"
        >
          <div className="fr-container">
            <button
              className="fr-link--close fr-link"
              aria-controls="header-navigation"
            >
              Fermer
            </button>
            <div className="fr-header__menu-links" />
          </div>
        </div>
      </div>

      {/* This slot can be used to display a secondary content (eg. a navigation bar) at the
        bottom of the header. For instance, we use it to display the `NavDev` component on localhost
        and sandbox. */}

      {props.secondary}
    </header>
  );
};
