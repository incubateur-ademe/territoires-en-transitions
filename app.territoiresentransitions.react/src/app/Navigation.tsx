import {Link, useParams} from 'react-router-dom';
import {useEpciId} from 'core-logic/hooks';
import {useCurrentEpci} from 'core-logic/hooks';

const EpciNavigation = () => {
  const epciId = useEpciId();
  const epci = useCurrentEpci();

  return (
    <>
      {epci && <span>{epci.nom}</span>}
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
    </>
  );
};

export const Navigation = () => {
  const {epciId} = useParams<{epciId: string}>();
  const isEpciRoute = !!epciId;
  return (
    <div className="fr-header__tools">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group pt-5">
          {isEpciRoute && <EpciNavigation />}

          <Link className="fr-link" to="/auth/signout">
            Déconnexion
          </Link>
        </ul>
      </div>
    </div>
  );
};
