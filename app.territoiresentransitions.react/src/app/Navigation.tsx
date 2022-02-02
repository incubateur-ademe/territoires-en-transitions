import {Link, useLocation} from 'react-router-dom';
import {
  allCollectivitesPath,
  makeCollectiviteDefaultPlanActionUrl,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteTableauBordUrl,
  makeCollectiviteUsersUrl,
  myCollectivitesPath,
  signInPath,
  signUpPath,
} from 'app/paths';
import {
  AuthBloc,
  authBloc,
  currentCollectiviteBloc,
} from 'core-logic/observables';
import {observer} from 'mobx-react-lite';
import * as R from 'ramda';

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
    <Link data-test="signin" className="fr-link" to={signInPath}>
      <div className="fr-fi-account-line m-1"></div>
      Se connecter
    </Link>
  );
});

const _activeTabStyle = (active: boolean): string =>
  `${active ? 'border-b-2 border-bf500' : ''}`;

const CollectiviteNavigationDirectTab = ({
  label,
  path,
}: {
  label: string;
  path: string;
}) => {
  const location = useLocation();
  const active = location.pathname === path;
  return (
    <Link className={`fr-nav__item p-4 ${_activeTabStyle(active)}`} to={path}>
      {label}
    </Link>
  );
};

const CollectiviteNavigationDropdownTab = (props: {
  menuLabel: string;
  listPathsAndLabels: {path: string; label: string}[];
}) => {
  const location = useLocation();
  const activePath = R.find(
    ({path}) => location.pathname === path,
    props.listPathsAndLabels
  )?.path;

  // Remove focus thus close the menu.
  // Since we are below useLocation it happens only when location change.
  if (document.activeElement instanceof HTMLElement)
    document.activeElement.blur();

  return (
    <div className="group relative">
      <div className={_activeTabStyle(!!activePath)}>
        <button className="p-4">{props.menuLabel}</button>
      </div>
      <nav className="bg-white invisible absolute left-0 top-full transition-all opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        <ul>
          {props.listPathsAndLabels.map(labelAndPathSuffix => (
            <li className="fr-nav__item" key={labelAndPathSuffix.label}>
              <Link
                className={`fr-nav__link whitespace-nowrap ${_activeTabStyle(
                  labelAndPathSuffix.path === activePath
                )}`}
                to={labelAndPathSuffix.path}
              >
                <span className="px-3">{labelAndPathSuffix.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export const CollectiviteNavigation = () => {
  return (
    currentCollectiviteBloc.currentCollectivite && (
      <nav className="flex flex-row gap-5" aria-label="Menu principal">
        <CollectiviteNavigationDirectTab
          label="Tableau de bord"
          path={makeCollectiviteTableauBordUrl({
            collectiviteId:
              currentCollectiviteBloc.currentCollectivite.collectivite_id,
          })}
        />

        <CollectiviteNavigationDropdownTab
          menuLabel="Référentiels"
          listPathsAndLabels={[
            {
              path: makeCollectiviteReferentielUrl({
                collectiviteId:
                  currentCollectiviteBloc.currentCollectivite.collectivite_id,
                referentielId: 'eci',
              }),

              label: 'Économie Circulaire',
            },
            {
              path: makeCollectiviteReferentielUrl({
                collectiviteId:
                  currentCollectiviteBloc.currentCollectivite.collectivite_id,
                referentielId: 'cae',
              }),
              label: 'Climat Air Énergie',
            },
          ]}
        />
        <CollectiviteNavigationDropdownTab
          menuLabel="Indicateurs"
          listPathsAndLabels={[
            {
              path: makeCollectiviteIndicateursUrl({
                collectiviteId:
                  currentCollectiviteBloc.currentCollectivite.collectivite_id,
                indicateurView: 'eci',
              }),
              label: 'Économie Circulaire',
            },
            {
              path: makeCollectiviteIndicateursUrl({
                collectiviteId:
                  currentCollectiviteBloc.currentCollectivite.collectivite_id,
                indicateurView: 'cae',
              }),
              label: 'Climat Air Énergie',
            },
            {
              path: makeCollectiviteIndicateursUrl({
                collectiviteId:
                  currentCollectiviteBloc.currentCollectivite.collectivite_id,
                indicateurView: 'crte',
              }),
              label: 'CRTE',
            },
            {
              path: makeCollectiviteIndicateursUrl({
                collectiviteId:
                  currentCollectiviteBloc.currentCollectivite.collectivite_id,
                indicateurView: 'perso',
              }),
              label: 'Personnalisés',
            },
          ]}
        />
        <CollectiviteNavigationDirectTab
          label="Plans d'action"
          path={makeCollectiviteDefaultPlanActionUrl({
            collectiviteId:
              currentCollectiviteBloc.currentCollectivite.collectivite_id,
          })}
        />
        {currentCollectiviteBloc.isReferent && (
          <CollectiviteNavigationDirectTab
            label="Gestion des accès"
            path={makeCollectiviteUsersUrl({
              collectiviteId:
                currentCollectiviteBloc.currentCollectivite.collectivite_id,
            })}
          />
        )}
      </nav>
    )
  );
};

export const Navigation = () => {
  return (
    <div className="fr-header__tools">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group">
          {authBloc.connected && (
            <>
              <Link className="fr-link" to={myCollectivitesPath}>
                Mes collectivités
              </Link>
              <Link className="fr-link" to={allCollectivitesPath}>
                Les autres collectivités
              </Link>
            </>
          )}
          <ConnexionSwitchLink bloc={authBloc} />
        </ul>
      </div>
    </div>
  );
};
