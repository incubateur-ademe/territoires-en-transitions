import {Link} from 'react-router-dom';
import {allEpcisPath, myEpcisPath, signInPath, signUpPath} from 'app/paths';
import {authBloc, currentEpciBloc} from 'core-logic/observables';

const ConnexionSwitchLink = () => {
  if (authBloc.connected)
    return (
      <Link className="fr-link" to={signUpPath}>
        <div className="fr-fi-account-line m-1"></div>
        Se déconnecter
      </Link>
    );
  return (
    <Link className="fr-link" to={signInPath}>
      <div className="fr-fi-account-line m-1"></div>
      Se connecter
    </Link>
  );
};

export const EpciNavigation = () => {
  return (
    currentEpciBloc.currentEpci && (
      <nav className="fr-nav" id="header-navigation" role="navigation">
        <ul className="fr-nav__list">
          <li className="fr-nav__item">
            <Link
              className="fr-nav__link"
              to={`/collectivite/${currentEpciBloc.currentEpci.siren}/tableau_bord`}
            >
              Tableau de bord
            </Link>
          </li>
          <li className="fr-nav__item">
            <Link
              className="fr-nav__link active"
              to={`/collectivite/${currentEpciBloc.currentEpci.siren}/plan_actions`}
            >
              Plans d'actions
            </Link>
          </li>
          <li className="fr-nav__item">
            <Link
              className="fr-nav__link"
              to={`/collectivite/${currentEpciBloc.currentEpci.siren}/referentiels`}
            >
              Référentiels
            </Link>
          </li>
          <li className="fr-nav__item">
            <Link
              className="fr-nav__link"
              to={`/collectivite/${currentEpciBloc.currentEpci.siren}/indicateurs`}
            >
              Indicateurs
            </Link>
          </li>
        </ul>
      </nav>
    )
  );
};

export const Navigation = () => {
  return (
    <div className="fr-header__tools">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group">
          {authBloc.connected ? (
            <Link className="fr-link" to={myEpcisPath}>
              Mes collectivités
            </Link>
          ) : (
            <></>
          )}
          <Link className="fr-link" to={allEpcisPath}>
            Toutes les collectivités
          </Link>

          <ConnexionSwitchLink />
        </ul>
      </div>
    </div>
  );
};
