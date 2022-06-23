import {useState} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {authBloc, CurrentCollectiviteObserved} from 'core-logic/observables';
import MobileNavigationCollectiviteItem from './MobileNavigationCollectiviteItem';
import {
  allCollectivitesPath,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectivitePlanActionUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteTableauBordUrl,
  makeCollectiviteUsersUrl,
  planActionDefaultId,
  signInPath,
  signUpPath,
} from 'app/paths';
import {LogoutBtn} from '../HeaderNavigation/HeaderNavigation';

/** FAKE DATA -> TODO: Replace with hook */
export interface CollectiviteNavSingle {
  label: string;
  path: string;
}

export interface CollectiviteNavDropdown {
  menuLabel: string;
  isSelectCollectivite?: boolean;
  listPathsAndLabels: CollectiviteNavSingle[];
}

const fakeCollectiviteNav: (CollectiviteNavSingle | CollectiviteNavDropdown)[] =
  [
    {
      isSelectCollectivite: true,
      menuLabel: 'Collectivité 1',
      listPathsAndLabels: [
        {
          label: 'Collectivité 1',
          path: makeCollectiviteTableauBordUrl({collectiviteId: 1}),
        },
        {
          label: 'Collectivité 2',
          path: makeCollectiviteTableauBordUrl({collectiviteId: 2}),
        },
        {
          label: 'Collectivité 3',
          path: makeCollectiviteTableauBordUrl({collectiviteId: 3}),
        },
      ],
    },
    {
      label: 'Tableau de bord',
      path: makeCollectiviteTableauBordUrl({collectiviteId: 1}),
    },
    {
      menuLabel: 'Climat Air Énergie',
      listPathsAndLabels: [
        {
          label: 'Référentiel',
          path: makeCollectiviteReferentielUrl({
            collectiviteId: 1,
            referentielId: 'cae',
          }),
        },
        {
          label: 'Indicateurs',
          path: makeCollectiviteIndicateursUrl({
            collectiviteId: 1,
            indicateurView: 'cae',
          }),
        },
        {
          label: 'Labellisation',
          path: makeCollectiviteLabellisationUrl({
            collectiviteId: 1,
            referentielId: 'cae',
          }),
        },
      ],
    },
    {
      menuLabel: 'Économie circulaire',
      listPathsAndLabels: [
        {
          label: 'Référentiel',
          path: makeCollectiviteReferentielUrl({
            collectiviteId: 1,
            referentielId: 'eci',
          }),
        },
        {
          label: 'Indicateurs',
          path: makeCollectiviteIndicateursUrl({
            collectiviteId: 1,
            indicateurView: 'eci',
          }),
        },
        {
          label: 'Labellisation',
          path: makeCollectiviteLabellisationUrl({
            collectiviteId: 1,
            referentielId: 'eci',
          }),
        },
      ],
    },
    {
      label: 'Pilotage',
      path: makeCollectivitePlanActionUrl({
        collectiviteId: 1,
        planActionUid: planActionDefaultId,
      }),
    },
    {
      menuLabel: 'Paramètres',
      listPathsAndLabels: [
        {
          label: 'Gestion des accès',
          path: makeCollectiviteUsersUrl({
            collectiviteId: 1,
          }),
        },
        {
          label: 'Personnalisation des référentiels',
          path: makeCollectivitePersoRefUrl({
            collectiviteId: 1,
          }),
        },
      ],
    },
    {
      label: 'Toutes les collectivités',
      path: allCollectivitesPath,
    },
  ];

const profilePath = '#';

export const isSingleNavItemDropdown = (
  item: CollectiviteNavSingle | CollectiviteNavDropdown
): item is CollectiviteNavDropdown =>
  (item as CollectiviteNavDropdown).listPathsAndLabels !== undefined;
/** END FAKE DATA */

type Props = {
  toggleMobileNavigation: () => void;
  collectivite: CurrentCollectiviteObserved | null;
  isConnected: boolean;
  user: any; // TODO: Type user
};

const MobileNavigation = ({
  toggleMobileNavigation,
  collectivite,
  isConnected,
  user,
}: Props) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toggleIsProfileOpen = () => setIsProfileOpen(!isProfileOpen);

  return (
    <div className="fixed overflow-y-auto inset-0 z-50 bg-white">
      <div className="flex p-4 pb-6">
        <button
          onClick={toggleMobileNavigation}
          className="flex items-center ml-auto px-2 py-2 fr-btn--secondary !shadow-none"
        >
          <span className="-mt-1">Fermer</span>
          <div className="fr-fi-close-line ml-2" />
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {collectivite !== null &&
          fakeCollectiviteNav.map(item => (
            <div>
              <MobileNavigationCollectiviteItem
                item={item}
                handleCloseMobileNavigation={toggleMobileNavigation}
              />
            </div>
          ))}
        <a
          data-test="help"
          className="fr-link block w-full !p-4"
          href="https://aide.territoiresentransitions.fr/fr/"
        >
          <div className="fr-fi-question-line mr-2" />
          Aide
        </a>
        {isConnected ? (
          <div>
            <button
              className="fr-link w-full !p-4"
              onClick={toggleIsProfileOpen}
            >
              <div className="fr-fi-account-line mr-2" />
              <span>{user.name}</span>
              <div
                className={`ml-auto fr-fi-arrow-down-s-line ${
                  isProfileOpen && 'rotate-180'
                }`}
              />
            </button>
            <div className={`${isProfileOpen ? 'block' : 'hidden'} pb-8`}>
              <NavLink
                className="block py-3 px-8"
                activeClassName="border-l-4 border-bf500 text-bf500 font-bold"
                to={profilePath}
                onClick={toggleMobileNavigation}
              >
                Profil
              </NavLink>
              <div className="py-3 px-8">
                <LogoutBtn
                  bloc={authBloc}
                  additionalOnClick={toggleMobileNavigation}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <Link
              data-test="signup"
              className="fr-link block w-full !p-4"
              to={signUpPath}
              onClick={toggleMobileNavigation}
            >
              <div className="fr-fi-add-line mr-2" />
              Créer un compte
            </Link>
            <Link
              data-test="signin"
              className="fr-link block w-full !p-4"
              to={signInPath}
              onClick={toggleMobileNavigation}
            >
              <div className="fr-fi-account-line mr-2" />
              Se connecter
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileNavigation;
