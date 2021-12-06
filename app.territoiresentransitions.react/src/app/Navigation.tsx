import {Link, useLocation} from 'react-router-dom';
import {
  allEpcisPath,
  makeEpciIndicateursPath,
  makeEpciReferentielsPath,
  makeEpciTabPath,
  myEpcisPath,
  signInPath,
  signUpPath,
} from 'app/paths';
import {AuthBloc, authBloc, currentEpciBloc} from 'core-logic/observables';
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

const EpciNavigationDirectTab = ({
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

const EpciNavigationDropdownTab = (props: {
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

export const EpciNavigation = () => {
  return (
    currentEpciBloc.currentEpci && (
      <nav className="flex flex-row gap-5" aria-label="Menu principal">
        <EpciNavigationDirectTab
          label="Tableau de bord"
          path={makeEpciTabPath({
            siren: currentEpciBloc.currentEpci.siren,
            tab: 'tableau_bord',
          })}
        />

        <EpciNavigationDropdownTab
          menuLabel="Référentiels"
          listPathsAndLabels={[
            {
              path: makeEpciReferentielsPath({
                siren: currentEpciBloc.currentEpci.siren,
                referentiel: 'eci',
              }),
              label: 'Économie Circulaire',
            },
            {
              path: makeEpciReferentielsPath({
                siren: currentEpciBloc.currentEpci.siren,
                referentiel: 'cae',
              }),
              label: 'Climat Air Énergie',
            },
          ]}
        />
        <EpciNavigationDropdownTab
          menuLabel="Indicateurs"
          listPathsAndLabels={[
            {
              path: makeEpciIndicateursPath({
                siren: currentEpciBloc.currentEpci.siren,
                view: 'eci',
              }),
              label: 'Économie Circulaire',
            },
            {
              path: makeEpciIndicateursPath({
                siren: currentEpciBloc.currentEpci.siren,
                view: 'cae',
              }),
              label: 'Climat Air Énergie',
            },
            {
              path: makeEpciIndicateursPath({
                siren: currentEpciBloc.currentEpci.siren,
                view: 'crte',
              }),
              label: 'CRTE',
            },
            {
              path: makeEpciIndicateursPath({
                siren: currentEpciBloc.currentEpci.siren,
                view: 'perso',
              }),
              label: 'Personnalisés',
            },
          ]}
        />
        <EpciNavigationDirectTab
          label="Plans d'actions"
          path={makeEpciTabPath({
            siren: currentEpciBloc.currentEpci.siren,
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
            <Link className="fr-link" to={myEpcisPath}>
              Mes collectivités
            </Link>
          ) : (
            <></>
          )}
          <Link className="fr-link" to={allEpcisPath}>
            Les autres collectivités
          </Link>

          <ConnexionSwitchLink bloc={authBloc} />
        </ul>
      </div>
    </div>
  );
};
