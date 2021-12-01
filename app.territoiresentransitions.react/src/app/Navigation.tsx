import {Link} from 'react-router-dom';
import {useConnected, useEpciId} from 'core-logic/hooks';
import {useCurrentEpci} from 'core-logic/hooks';

const ConnexionSwitchLink = () => {
  const connected = useConnected();
  if (connected)
    return (
      <Link className="fr-link" to="/auth/signout">
        <div className="fr-fi-account-line m-1"></div>
        Déconnexion
      </Link>
    );
  return (
    <Link className="fr-link" to="/auth/signin">
      <div className="fr-fi-account-line m-1"></div>
      Se connecter
    </Link>
  );
};

export const EpciNavigation = () => {
  const epciId = useEpciId();
  const epci = useCurrentEpci();

  return (
    // <div className="fr-links-group">

    <nav className="fr-nav" id="header-navigation" role="navigation">
      {/* {epci && <span className="text-lg px-2">{epci.nom}</span>} */}
      <ul className="fr-nav__list">
        <li className="fr-nav__item">
          <Link
            className="fr-nav__link"
            to={`/collectivite/${epciId}/tableau_bord`}
          >
            Tableau de bord
          </Link>
        </li>
        <li className="fr-nav__item">
          <Link
            className="fr-nav__link active"
            to={`/collectivite/${epciId}/plan_actions`}
          >
            Plans d'actions
          </Link>
        </li>
        <li className="fr-nav__item">
          <Link
            className="fr-nav__link"
            to={`/collectivite/${epciId}/referentiels`}
          >
            Référentiels
          </Link>
        </li>
        <li className="fr-nav__item">
          <Link
            className="fr-nav__link"
            to={`/collectivite/${epciId}/indicateurs`}
          >
            Indicateurs
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export const Navigation = () => {
  return (
    <div className="fr-header__tools">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group">
          <Link className="fr-link" to="/all_epcis">
            Toutes les collectivités
          </Link>
          <Link className="fr-link" to="/">
            Mes collectivités
          </Link>
          <ConnexionSwitchLink />
        </ul>
      </div>
    </div>
  );
};
