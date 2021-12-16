import 'app/DesignSystem/footer.css';
import 'app/DesignSystem/logo.css';
import React from 'react';
import {Link} from 'react-router-dom';

export type FooterProps = {
  description: React.ReactElement;
  navigation: React.ReactElement;
};

export const FooterNavigation = () => (
  <div className="fr-footer__bottom">
    <ul className="fr-footer__bottom-list">
      <li className="fr-footer__bottom-item">
        <a
          className="fr-footer__bottom-link"
          href="https://territoiresentransitions.fr/mentions-legales/"
          target="_self"
        >
          Mentions légales
        </a>
      </li>
      <li className="fr-footer__bottom-item">
        <a
          className="fr-footer__bottom-link"
          href="https://www.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel"
          rel="external noreferrer"
          target="_blank"
        >
          Protection des données
        </a>
      </li>
      <li className="fr-footer__bottom-item">
        <Link className="fr-footer__bottom-link" to="/statistics">
          {' '}
          Statistiques{' '}
        </Link>
      </li>
    </ul>
  </div>
);

export const FooterDescription = () => (
  <div>
    <p className="fr-footer__content-desc">
      Territoires en transitions accompagne les collectivités afin de les aider
      à piloter plus facilement leur transition écologique.
    </p>
    <p className="fr-footer__content-desc">
      Vous rencontrez une difficulté ? Une suggestion pour nous aider à
      améliorer l'outil ? Écrivez-nous à :
      <a href="mailto:aide@territoiresentransitions.fr?subject=Aide sur app.territoiresentransitions.fr">
        aide@territoiresentransitions.fr
      </a>
    </p>
  </div>
);

export const Footer = (props: FooterProps) => {
  return (
    <footer
      className="footer fr-footer fr-mt-10w"
      role="contentinfo"
      id="footer"
    >
      <div className="fr-container">
        <div className="fr-footer__body">
          <div className="fr-footer__brand fr-enlarge-link">
            <p className="fr-logo" title="république française">
              république
              <br />
              française
            </p>
            <div className="px-5">
              <picture>
                <source
                  src="https://territoiresentransitions.fr/img/ademe.jpg 118w"
                  sizes="118px"
                />
                <img
                  className="footer__logo"
                  height="100"
                  src="https://territoiresentransitions.fr/img/ademe.jpg"
                  alt="ADEME"
                  loading="lazy"
                />
              </picture>
            </div>
            <div className="fr-header__service">
              <a href="https://territoiresentransitions.fr" title="Accueil">
                <p className="fr-header__service-title">
                  Territoires en Transitions
                </p>
              </a>
            </div>

            <div className="fr-footer__content">
              {/* <!-- A small sentence in the footer to describe the service --> */}
              {/* <slot name="description"></slot> */}
              {props.description}
              <ul className="fr-footer__content-list">
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://www.ademe.fr/"
                  >
                    ademe.fr
                  </a>
                </li>
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://beta.gouv.fr/"
                  >
                    beta.gouv
                  </a>
                </li>
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://territoireengagetransitionecologique.ademe.fr/"
                  >
                    territoireengagetransitionecologique.ademe.fr
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {props.navigation}
      </div>
    </footer>
  );
};
