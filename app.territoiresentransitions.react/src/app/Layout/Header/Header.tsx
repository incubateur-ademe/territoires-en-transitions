import {useState} from 'react';
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
import HeaderNavigation from './HeaderNavigation';
import CollectiviteNavigation from './CollectiviteNavigation';
import MobileNavigation from './MobileNavigation';

/** FAKE DATA -> TODO: Replace with hook */
// const fakeCollectivite: CurrentCollectiviteObserved | null = {
//   nom: 'Test collectivite',
//   collectivite_id: 1,
//   role_name: null,
// };

const fakeCollectivite = null;

const isConnected = false;

const fakeUser = {
  name: 'Émeline',
};
/** END FAKE DATA */

export const HeaderObserver = observer(
  ({
    authBloc,
    currentCollectiviteBloc,
    isConnected,
    collectivite,
  }: {
    authBloc: AuthBloc;
    currentCollectiviteBloc: CurrentCollectiviteBloc;
    isConnected: boolean;
    collectivite: CurrentCollectiviteObserved | null;
  }) => {
    const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
    const toggleMobileNavigation = () =>
      setIsMobileNavigationOpen(!isMobileNavigationOpen);

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
                {isMobileNavigationOpen ? (
                  <MobileNavigation
                    toggleMobileNavigation={toggleMobileNavigation}
                    collectivite={collectivite}
                    isConnected={isConnected}
                    user={fakeUser}
                  />
                ) : (
                  <button
                    onClick={toggleMobileNavigation}
                    className="fr-fi-menu-fill absolute top-6 right-6 z-10 lg:hidden"
                  />
                )}
              </div>
            </div>
          </div>
          {collectivite !== null && (
            <CollectiviteNavigation collectivite={collectivite} />
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
      currentCollectiviteBloc={currentCollectiviteBloc}
      authBloc={authBloc}
      isConnected={isConnected}
      collectivite={fakeCollectivite}
    />
  );
};

export default Header;
