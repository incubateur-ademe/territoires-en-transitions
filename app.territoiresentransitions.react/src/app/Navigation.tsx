import {Link, useParams} from 'react-router-dom';
import {useAppState} from 'core-logic/overmind';

const EpciNavigation = () => {
  const currentEpciId = useAppState().currentEpciId;

  return (
    <>
      <li>
        <Link className="fr-link" to="/epcis">
          Changer
        </Link>
      </li>
      <li>
        <Link className="fr-link" to={`/collectivite/${currentEpciId}/fiches`}>
          Mon plan d'actions
        </Link>
      </li>
      <li>
        <Link
          className="fr-link"
          to={`/collectivite/${currentEpciId}/actions_referentiels`}
        >
          Référentiels
        </Link>
      </li>
      <li>
        <Link
          className="fr-link"
          to={`/collectivite/${currentEpciId}/indicateurs`}
        >
          Indicateurs
        </Link>
      </li>
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
          <li>
            <Link className="fr-link" to="/auth/signout">
              Déconnexion
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};
