import { Navigation } from "app/Navigation/Navigation";
import { ActionsReferentiels } from "app/pages/ActionsReferentiels/ActionsReferentiels";
import { Epcis } from "app/pages/Epcis/Epcis";
import { overmind } from "core-logic/overmind";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useParams,
  useRouteMatch,
  Redirect,
} from "react-router-dom";

import {Footer, Header} from "ui";
import {Indicateurs} from "./pages/Indicateurs/Indicateurs";

const Connected = () => {
  let { path } = useRouteMatch();
  const { epciId } = useParams<{ epciId: string }>();
  overmind.actions.setCurrentEpci(epciId);

  if (false) {
    // todo redirect when user is not authenticated: https://reactrouter.com/web/example/auth-workflow
    return <Redirect to="" />;
  }
  return (
      <>
        <Route path={`${path}/actions_referentiels`}>
          <ActionsReferentiels/>
        </Route>
        <Route path={`${path}/indicateurs`}>
          <Indicateurs/>
        </Route>
      </>
  );
};

export const App = () => {
  return (
    <Router>
      <Header nav={<Navigation />} />

      <Switch>
        <Route exact path="/">
          <Epcis />
        </Route>
        <Route path={`/epcis/:epciId`}>
          <Epcis />
        </Route>

        <Route path={`/:epciId`}>
          <Connected></Connected>
        </Route>
      </Switch>

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
    </Router>
  );
};
