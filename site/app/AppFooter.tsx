import Image from 'next/image';

const AppFooter = () => {
  return (
    <footer className="fr-footer" role="contentinfo" id="footer">
      <div className="fr-container">
        <div className="fr-footer__body">
          <div className="fr-footer__brand fr-enlarge-link">
            <p className="fr-logo">
              République
              <br />
              Française
            </p>
            <a
              href="/"
              title="Accueil - Territoires en Transitions"
              className="fr-footer__brand-link"
            >
              <Image src="/ademe.jpg" alt="ADEME" width="128" height="146" />
            </a>
          </div>
          <div className="fr-footer__content">
            <p className="fr-footer__content-desc fr-mb-2w">
              <span style={{fontSize: 'x-large', fontWeight: 'bold'}}>
                Territoires en Transitions
              </span>
              <br />
              <span>
                Accompagner la transition écologique des collectivités
              </span>
            </p>
            <p className="fr-footer__content-desc">
              Territoires en transitions accompagne les collectivités afin de
              les aider à piloter plus facilement leur transition écologique.{' '}
            </p>
            <p className="fr-footer__content-desc">
              Vous rencontrez une difficulté ? Une suggestion pour nous aider à
              améliorer l&apos;outil ?
              <br />
              Écrivez-nous à&nbsp;:&nbsp;
              <a href="mailto:aide@territoiresentransitions.fr?subject=Aide sur app.territoiresentransitions.fr">
                aide@territoiresentransitions.fr
              </a>
            </p>
            <ul className="fr-footer__content-list">
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  target="_blank"
                  href="https://beta.gouv.fr"
                  rel="noreferrer"
                >
                  ademe.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  target="_blank"
                  href="https://gouvernement.fr"
                  rel="noreferrer"
                >
                  beta.gouv
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  target="_blank"
                  href="https://territoireengagetransitionecologique.ademe.fr"
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
              <span className="fr-footer__bottom-link">
                Accessibilité: non conforme
              </span>
            </li>
            <li className="fr-footer__bottom-item">
              <a href="/mentions" className="fr-footer__bottom-link">
                Mentions légales
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a
                href="https://expertises.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel"
                className="fr-footer__bottom-link"
              >
                Données personnelles
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a href="/stats" className="fr-footer__bottom-link">
                Statistiques
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a href="/cgu" className="fr-footer__bottom-link">
                Conditions générales d’utilisation
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
