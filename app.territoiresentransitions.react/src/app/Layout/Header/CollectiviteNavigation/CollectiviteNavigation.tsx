import {NavLink} from 'react-router-dom';
import {
  makeCollectiviteDefaultPlanActionUrl,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteTableauBordUrl,
  makeCollectiviteUsersUrl,
} from 'app/paths';
import {CurrentCollectiviteObserved} from 'core-logic/observables';
import CollectiviteNavigationDropdownTab from './CollectiviteNavigationDropdownTab';

export const activeTabClassName = 'border-b-2 border-bf500';

export const _activeTabStyle = (active: boolean): string =>
  `${active ? activeTabClassName : ''}`;

type Props = {
  collectivite: CurrentCollectiviteObserved;
};

const CollectiviteNavigation = ({collectivite}: Props) => {
  return (
    <div className="fr-container hidden lg:block">
      <div className="flex flex-row justify-between">
        <nav className="flex flex-row gap-5" aria-label="Menu principal">
          <NavLink
            className="fr-nav__item p-4"
            activeClassName={activeTabClassName}
            to={makeCollectiviteTableauBordUrl({
              collectiviteId: collectivite.collectivite_id,
            })}
          >
            Tableau de bord
          </NavLink>
          <CollectiviteNavigationDropdownTab
            menuLabel="Référentiels"
            listPathsAndLabels={[
              {
                path: makeCollectiviteReferentielUrl({
                  collectiviteId: collectivite.collectivite_id,
                  referentielId: 'eci',
                }),

                label: 'Économie Circulaire',
              },
              {
                path: makeCollectiviteReferentielUrl({
                  collectiviteId: collectivite.collectivite_id,
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
                  collectiviteId: collectivite.collectivite_id,
                  indicateurView: 'eci',
                }),
                label: 'Économie Circulaire',
              },
              {
                path: makeCollectiviteIndicateursUrl({
                  collectiviteId: collectivite.collectivite_id,
                  indicateurView: 'cae',
                }),
                label: 'Climat Air Énergie',
              },
              {
                path: makeCollectiviteIndicateursUrl({
                  collectiviteId: collectivite.collectivite_id,
                  indicateurView: 'crte',
                }),
                label: 'CRTE',
              },
              {
                path: makeCollectiviteIndicateursUrl({
                  collectiviteId: collectivite.collectivite_id,
                  indicateurView: 'perso',
                }),
                label: 'Personnalisés',
              },
            ]}
          />
          <NavLink
            className="fr-nav__item p-4"
            activeClassName={activeTabClassName}
            to={makeCollectiviteDefaultPlanActionUrl({
              collectiviteId: collectivite.collectivite_id,
            })}
          >
            Plans d'action
          </NavLink>
          <CollectiviteNavigationDropdownTab
            menuLabel="Labellisation"
            listPathsAndLabels={[
              {
                path: makeCollectiviteLabellisationUrl({
                  collectiviteId: collectivite.collectivite_id,
                  referentielId: 'eci',
                }),

                label: 'Économie Circulaire',
              },
              {
                path: makeCollectiviteLabellisationUrl({
                  collectiviteId: collectivite.collectivite_id,
                  referentielId: 'cae',
                }),
                label: 'Climat Air Énergie',
              },
            ]}
          />
          <CollectiviteNavigationDropdownTab
            menuLabel="Paramètres"
            listPathsAndLabels={[
              {
                label: 'Gestion des accès',
                path: makeCollectiviteUsersUrl({
                  collectiviteId: collectivite.collectivite_id,
                }),
              },
              {
                label: 'Personnalisation des référentiels',
                path: makeCollectivitePersoRefUrl({
                  collectiviteId: collectivite.collectivite_id,
                }),
              },
            ]}
          />
        </nav>
        <div className="flex items-center font-bold">{collectivite.nom}</div>
      </div>
    </div>
  );
};

export default CollectiviteNavigation;
