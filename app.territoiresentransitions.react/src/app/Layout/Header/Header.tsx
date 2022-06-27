import {
  authBloc,
  AuthBloc,
  currentCollectiviteBloc,
  CurrentCollectiviteBloc,
  CurrentCollectiviteObserved,
} from 'core-logic/observables';
import {observer} from 'mobx-react-lite';
import {CollectiviteRedirector} from 'app/Redirector';
import {RejoindreCetteCollectiviteDialog} from 'app/pages/MesCollectivites/RejoindreCetteCollectiviteDialog';
import {getReferentContacts} from 'core-logic/api/procedures/collectiviteProcedures';
import LogoRepubliqueFrancaise from 'ui/logo/LogoRepubliqueFrancaise';
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
} from 'app/paths';
import HeaderNavigation from './HeaderNavigation';
import CollectiviteNavigation from './CollectiviteNavigation';
import MobileNavigation from './MobileNavigation';

/** FAKE DATA -> TODO: Replace with hook */
const fakeCollectivite: CurrentCollectiviteObserved | null = {
  nom: 'Collectivité 1',
  collectivite_id: 1,
  role_name: null,
};

// const fakeCollectivite = null;

const fakeOwnedCollectivites: CurrentCollectiviteObserved[] = [
  {
    nom: 'Collectivité 1',
    collectivite_id: 1,
    role_name: null,
  },
  {
    nom: 'Collectivité 2',
    collectivite_id: 2,
    role_name: null,
  },
  {
    nom: 'Collectivité 3',
    collectivite_id: 3,
    role_name: null,
  },
];

const isConnected = false;

const fakeUser = {
  name: 'Émeline',
};

export interface CollectiviteNavSingle {
  displayOnlyToMember?: boolean;
  label: string;
  path: string;
}

export interface CollectiviteNavDropdown {
  isSelectCollectivite?: boolean;
  displayOnlyToMember?: boolean;
  menuLabel: string;
  listPathsAndLabels: CollectiviteNavSingle[];
}

export const isSingleNavItemDropdown = (
  item: CollectiviteNavSingle | CollectiviteNavDropdown
): item is CollectiviteNavDropdown =>
  (item as CollectiviteNavDropdown).listPathsAndLabels !== undefined;

const collectiviteNav: (CollectiviteNavSingle | CollectiviteNavDropdown)[] = [
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
    menuLabel: 'Pilotage',
    listPathsAndLabels: [
      {
        label: "Plans d'action",
        path: makeCollectivitePlanActionUrl({
          collectiviteId: 1,
          planActionUid: planActionDefaultId,
        }),
      },
      {
        label:
          'Indicateurs contrat de relance et de transition écologique (CRTE)',
        path: makeCollectiviteIndicateursUrl({
          collectiviteId: 1,
          indicateurView: 'crte',
        }),
      },
      {
        label: 'Indicateurs personnalisés',
        path: makeCollectiviteIndicateursUrl({
          collectiviteId: 1,
          indicateurView: 'perso',
        }),
      },
    ],
  },
  {
    displayOnlyToMember: true,
    menuLabel: 'Paramètres',
    listPathsAndLabels: [
      {
        label: 'Personnalisation des référentiels',
        path: makeCollectivitePersoRefUrl({
          collectiviteId: 1,
        }),
      },
      {
        label: 'Gestion des membres',
        path: makeCollectiviteUsersUrl({
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
/** END FAKE DATA */

export const HeaderObserver = observer(
  ({
    authBloc,
    currentCollectiviteBloc,
    isConnected,
    collectivite,
    ownedCollectivite,
  }: {
    authBloc: AuthBloc;
    currentCollectiviteBloc: CurrentCollectiviteBloc;
    isConnected: boolean;
    collectivite: CurrentCollectiviteObserved | null;
    ownedCollectivite: CurrentCollectiviteObserved[] | null;
  }) => {
    return (
      <>
        <CollectiviteRedirector />
        <header role="banner" className="header fr-header ">
          <div className="fr-header__body">
            <div className="fr-container">
              <div className="fr-header__body-row header__row">
                <div className="fr-header__brand fr-enlarge-link pointer-events-none lg:pointer-events-auto">
                  <div className="fr-header__brand-top !w-auto">
                    <div className="fr-header__logo">
                      <LogoRepubliqueFrancaise />
                    </div>
                  </div>
                  <div className="fr-header__ademe flex-shrink-0">
                    <img
                      src="https://territoiresentransitions.fr/img/ademe.jpg"
                      alt="logo ADEME"
                      loading="lazy"
                      className="h-20"
                    />
                  </div>
                  <div className="fr-header__service">
                    <a href="/" title="Accueil">
                      <p className="fr-header__service-title pointer-events-auto">
                        Territoires en Transitions
                      </p>
                    </a>
                    <p className="text-sm">
                      Accompagner la transition écologique des collectivités
                    </p>
                  </div>
                </div>
                <HeaderNavigation isConnected={isConnected} user={fakeUser} />
                <MobileNavigation
                  isConnected={isConnected}
                  user={fakeUser}
                  collectiviteNav={collectiviteNav}
                  currentCollectivite={collectivite}
                  ownedCollectivites={ownedCollectivite}
                />
              </div>
            </div>
          </div>
          {collectivite !== null && ownedCollectivite !== null && (
            <CollectiviteNavigation
              collectiviteNav={collectiviteNav}
              currentCollectivite={collectivite}
              ownedCollectivites={ownedCollectivite}
            />
          )}
        </header>
        <CollectiviteReadOnlyBanner bloc={currentCollectiviteBloc} />
      </>
    );
  }
);

const CollectiviteReadOnlyBanner = observer(
  ({bloc}: {bloc: CurrentCollectiviteBloc}) => {
    if (bloc.readonly)
      return (
        <div className="flex justify-center items-center bg-yellow-400 py-4 bg-opacity-70">
          <div className="text-sm mr-4">Lecture seule</div>
          <RejoindreCetteCollectiviteDialog
            getReferentContacts={getReferentContacts}
            collectivite={bloc.currentCollectivite!}
          />
        </div>
      );
    return null;
  }
);

const Header = () => {
  return (
    <HeaderObserver
      authBloc={authBloc}
      currentCollectiviteBloc={currentCollectiviteBloc}
      isConnected={isConnected}
      collectivite={fakeCollectivite}
      ownedCollectivite={fakeOwnedCollectivites}
    />
  );
};

export default Header;
