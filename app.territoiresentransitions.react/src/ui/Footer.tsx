import "app/DesignSystem/footer.css";
import "app/DesignSystem/logo.css";
import React from "react";

export type FooterProps = {
  description: React.ReactElement;
  navigation: React.ReactElement;
};

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
            <div className="fr-footer__logo fr-p-1w">
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
                  href="http://citergie.ademe.fr/"
                >
                  citergie.fr
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* <!-- The footer navigation bar --> */}
        {/* <slot name="navigation"></slot> */}
        {props.navigation}
      </div>
    </footer>
  );
};
