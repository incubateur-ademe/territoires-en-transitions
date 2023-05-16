import Image from 'next/image';

const AppFooter = () => {
  return (
    <footer className="fr-footer" role="contentinfo" id="footer">
      <div className="fr-container">
        <div className="fr-footer__body">
          <div className="fr-footer__brand">
            <p className="fr-logo">
              République
              <br />
              Française
            </p>
            <Image
              src="/ademe.jpg"
              alt="ADEME"
              width="128"
              height="146"
              className="fr-ml-2w"
            />
          </div>
          <div className="fr-footer__content">
            <p className="fr-footer__content-desc">
              Territoires en Transitions est une startup d'État portée par
              l'Agence de la Transition Écologique (ADEME) avec le soutien de
              l'Agence Nationale de la Cohésion des Territoires (ANCT).
            </p>
            <ul className="fr-footer__content-list">
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  href="https://www.ademe.fr/"
                  target="_blank"
                  rel="noreferrer"
                >
                  ademe.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  href="https://beta.gouv.fr/"
                  target="_blank"
                  rel="noreferrer"
                >
                  beta.gouv
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  href="https://territoireengagetransitionecologique.ademe.fr"
                  target="_blank"
                  rel="noreferrer"
                >
                  territoireengagetransitionecologique.ademe.fr
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="fr-footer__bottom">
          <ul className="fr-footer__bottom-list">
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="/stats">
                Statistiques
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <span className="fr-footer__bottom-link">
                <a className="fr-footer__bottom-link" href="/accessibilite">
                  Accessibilité : non conforme
                </a>
              </span>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="/mentions">
                Mentions légales
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a
                className="fr-footer__bottom-link"
                href="https://www.ademe.fr/donnees-personnelles/"
                target="_blank"
                rel="noreferrer"
              >
                Données personnelles
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="/cookies">
                Gestion des cookies
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a
                className="fr-footer__bottom-link"
                href="https://github.com/betagouv/territoires-en-transitions"
                target="_blank"
                rel="noreferrer"
              >
                Code source
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="/cgu">
                Conditions générales d’utilisation
              </a>
            </li>
          </ul>
          <div className="fr-footer__bottom-copy">
            <p>
              Sauf mention contraire, tous les contenus de ce site sont sous{' '}
              <a
                href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
                target="_blank"
                rel="noreferrer"
              >
                licence etalab-2.0
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
