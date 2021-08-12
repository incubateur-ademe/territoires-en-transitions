import { Link, useParams, useRouteMatch } from "react-router-dom";
import { overmind } from "core-logic/overmind";

export const EpciNavigation = () => {
  const { epciId } = useParams<{ epciId: string }>();
  const { path } = useRouteMatch();
  console.log("Path in EpciNavigation is ", path);
  overmind.actions.setCurrentEpci(epciId);

  console.log("EpciNavigation thinks epci id is ", epciId);

  if (epciId)
    return (
      <>
        <li>
          <Link className="fr-link" to="/epcis">
            Changer
          </Link>
        </li>
        <li>
          <Link className="fr-link" to="/">
            Mon plan d'actions
          </Link>
        </li>
        <li>
          <Link className="fr-link" to="/actions_referentiels">
            Référentiels
          </Link>
        </li>
        <li>
          <Link className="fr-link" to="/">
            Indicateurs
          </Link>
        </li>
      </>
    );
  return <></>;
};

export const Navigation = () => {
  return (
    <div className="fr-header__tools">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group">
          <EpciNavigation />
          <li>
            <Link className="fr-link" to="/">
              Déconnexion
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};
