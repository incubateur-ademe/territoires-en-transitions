import {Link, useParams} from 'react-router-dom';
import {useEpciId} from 'core-logic/hooks';
import {useCurrentEpci} from 'core-logic/hooks';

const EpciNavigation = () => {
  const epciId = useEpciId();
  const epci = useCurrentEpci();

  return (
    <>
      {epci && <span className="text-lg px-2">{epci.nom}</span>}
      <Link className="px-2" to="/epcis">
        Changer
      </Link>

      <Link className="px-2" to={`/collectivite/${epciId}/plan_actions`}>
        Mon plan d'actions
      </Link>
      <Link className="px-2" to={`/collectivite/${epciId}/referentiels`}>
        Référentiels
      </Link>
      <Link className="px-2" to={`/collectivite/${epciId}/indicateurs`}>
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
        <ul className="fr-links-group">
          {isEpciRoute && <EpciNavigation />}

          <Link className="px-2" to="/auth/signout">
            Déconnexion
          </Link>
        </ul>
      </div>
    </div>
  );
};
