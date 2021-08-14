import { Link, useParams } from "react-router-dom";
import { useActions, useAppState } from "core-logic/overmind";

export const EpciNavigation = () => {
  const { epciId } = useParams<{ epciId: string }>();

  useActions().epcis.setCurrentEpci(epciId);

  const currentEpciId = useAppState().currentEpciId;

  if (currentEpciId)
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
  console.log("EPCI ID", epciId, "inconnue ... (devrait être un pop-up) ");
  return (
    <>
      <li>
        <Link className="fr-link" to="/epcis">
          Changer
        </Link>
      </li>
    </>
  );
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
