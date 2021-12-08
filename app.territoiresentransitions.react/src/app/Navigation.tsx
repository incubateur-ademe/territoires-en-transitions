import {Link, useLocation} from 'react-router-dom';
import {
  allCollectivitesPath,
  makeCollectiviteIndicateursPath,
  makeCollectiviteReferentielsPath,
  makeCollectiviteTabPath,
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
    <Link className="fr-link" to={signInPath}>
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
  return (
    <div className="group relative">
      <div className={_activeTabStyle(!!activePath)}>
        <button className="fr-nav__item p-4">{props.menuLabel}</button>
      </div>
      <nav
        tabIndex={0}
        className=" bg-white invisible absolute left-0 top-full transition-all opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1"
      >
        <ul>
          {props.listPathsAndLabels.map(labelAndPathSuffix => (
            <li className="fr-nav__item">
              <Link
                className={`fr-nav__link ${_activeTabStyle(
                  labelAndPathSuffix.path === activePath
                )}`}
                to={labelAndPathSuffix.path}
              >
                {labelAndPathSuffix.label}
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
          path={makeCollectiviteTabPath({
            id: currentCollectiviteBloc.currentCollectivite.id,
            tab: 'tableau_bord',
          })}
        />

        <CollectiviteNavigationDropdownTab
          menuLabel="Référentiels"
          listPathsAndLabels={[
            {
              path: makeCollectiviteReferentielsPath({
                id: currentCollectiviteBloc.currentCollectivite.id,
                referentiel: 'eci',
              }),
              label: 'Économie Circulaire',
            },
            {
              path: makeCollectiviteReferentielsPath({
                id: currentCollectiviteBloc.currentCollectivite.id,
                referentiel: 'cae',
              }),
              label: 'Climat Air Énergie',
            },
          ]}
        />
        <CollectiviteNavigationDropdownTab
          menuLabel="Indicateurs"
          listPathsAndLabels={[
            {
              path: makeCollectiviteIndicateursPath({
                id: currentCollectiviteBloc.currentCollectivite.id,
                view: 'eci',
              }),
              label: 'Économie Circulaire',
            },
            {
              path: makeCollectiviteIndicateursPath({
                id: currentCollectiviteBloc.currentCollectivite.id,
                view: 'cae',
              }),
              label: 'Climat Air Énergie',
            },
            {
              path: makeCollectiviteIndicateursPath({
                id: currentCollectiviteBloc.currentCollectivite.id,
                view: 'crte',
              }),
              label: 'CRTE',
            },
            {
              path: makeCollectiviteIndicateursPath({
                id: currentCollectiviteBloc.currentCollectivite.id,
                view: 'perso',
              }),
              label: 'Personnalisés',
            },
          ]}
        />
        <CollectiviteNavigationDirectTab
          label="Plans d'actions"
          path={makeCollectiviteTabPath({
            id: currentCollectiviteBloc.currentCollectivite.id,
            tab: 'plans_actions',
          })}
        />
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
            <Link className="fr-link" to={myCollectivitesPath}>
              Mes collectivités
            </Link>
          ) : (
            <></>
          )}
          <Link className="fr-link" to={allCollectivitesPath}>
            Les autres collectivités
          </Link>

          <ConnexionSwitchLink bloc={authBloc} />
        </ul>
      </div>
    </div>
  );
};
