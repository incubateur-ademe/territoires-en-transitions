import { Navigation } from "app/Navigation/Navigation";
import { Router } from "app/Router";
import { Footer, Header } from "ui";

export const App = () => {
  return (
    <>
      <Header nav={<Navigation />} />
      <Router />
      <Footer
        description={
          <div>
            <p className="fr-footer__content-desc">
              Territoires en transitions accompagne les collectivités afin de
              les aider à piloter plus facilement leur transition écologique.
            </p>
            <p className="fr-footer__content-desc">
              Vous rencontrez une difficulté ? Une suggestion pour nous aider à
              améliorer l'outil ? Écrivez-nous à :
              <a href="mailto:aide@territoiresentransitions.fr?subject=Aide sur app.territoiresentransitions.fr">
                aide@territoiresentransitions.fr
              </a>
            </p>
          </div>
        }
        navigation={
          <div>
            {" "}
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
              </ul>
            </div>
          </div>
        }
      />
    </>
  );
};
