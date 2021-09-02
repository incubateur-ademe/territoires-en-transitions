import {Link, useParams} from 'react-router-dom';
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

const EpciNavigation = () => {
  const epciId = useEpciId();
  const epci = useCurrentEpci();

  return (
    <div className="fr-links-group">
      {epci && <span className="text-lg px-2">{epci.nom}</span>}
      <Link className="fr-link" to="/epcis">
        Changer
      </Link>

      <Link className="fr-link" to={`/collectivite/${epciId}/plan_actions`}>
        Mon plan d'actions
      </Link>
      <Link className="fr-link" to={`/collectivite/${epciId}/referentiels`}>
        Référentiels
      </Link>
      <Link className="fr-link" to={`/collectivite/${epciId}/indicateurs`}>
        Indicateurs
      </Link>
    </div>
  );
};

export const Navigation = () => {
  const {epciId} = useParams<{epciId: string}>();
  const isEpciRoute = !!epciId;
  return (
    <div className="fr-header__tools">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group">
          {isEpciRoute && <EpciNavigation />}
          <ConnexionSwitchLink />
        </ul>
      </div>
    </div>
  );
};
