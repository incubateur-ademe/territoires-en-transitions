import {Link, useLocation} from 'react-router-dom';
import {allEpcisPath, myEpcisPath, signInPath, signUpPath} from 'app/paths';
import {AuthBloc, authBloc, currentEpciBloc} from 'core-logic/observables';
import {observer} from 'mobx-react-lite';

const ConnexionSwitchLink = observer(({bloc}: {bloc: AuthBloc}) => {
  if (bloc.connected)
    return (
      <Link
        className="fr-link"
        to={signUpPath}
        onClick={() => {
          bloc.disconnect();
        }}
      >
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
});

const EpciNavigationTab = ({
  siren,
  label,
  pathSuffix,
}: {
  siren: string;
  label: string;
  pathSuffix: string;
}) => {
  const location = useLocation();
  const active = location.pathname.includes(pathSuffix);
  return (
    <Link
      className={`fr-nav__item p-4 ${active ? 'border-b-2 border-bf500' : ''}`}
      to={`/collectivite/${siren}/${pathSuffix}`}
    >
      {label}
    </Link>
  );
};

const LaLa = () => (
  <div>
    <select
      className="mt-2 w-full bg-beige p-3 border-b-2 border-gray-500"
      onChange={opt => {
        console.log('lala', opt);
      }}
    >
      <label className="fr-label">label</label>
      <option key="la" value="la">
        Option1
      </option>
      <option key="li" value="li">
        Option2
      </option>
    </select>
  </div>
);
export const EpciNavigation = () => {
  return (
    currentEpciBloc.currentEpci && (
      <nav className="flex flex-row gap-5" aria-label="Menu principal">
        <EpciNavigationTab
          siren={currentEpciBloc.currentEpci.siren}
          label="Tableau de bord"
          pathSuffix="tableau_bord"
        />

        <EpciNavigationTab
          siren={currentEpciBloc.currentEpci.siren}
          label="Plans d'actions"
          pathSuffix="plan_action"
        />

        <EpciNavigationTab
          siren={currentEpciBloc.currentEpci.siren}
          label="Référentiels"
          pathSuffix="referentiel"
        />

        <EpciNavigationTab
          siren={currentEpciBloc.currentEpci.siren}
          label="Indicateurs"
          pathSuffix="indicateurs"
        />
        <LaLa />
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
            Les collectivités
          </Link>

          <ConnexionSwitchLink bloc={authBloc} />
        </ul>
      </div>
    </div>
  );
};
