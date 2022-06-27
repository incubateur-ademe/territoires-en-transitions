import {useState} from 'react';
import {CollectiviteRedirector} from 'app/Redirector';
import {JoinCurrentCollectiviteDialog} from 'app/pages/CurrentUserCollectivite/_AddDialog';
import LogoRepubliqueFrancaise from 'ui/logo/LogoRepubliqueFrancaise';
import HeaderNavigation from './HeaderNavigation';
import CollectiviteNavigation from './CollectiviteNavigation';
import MobileNavigation from './MobileNavigation';
import {useAuth, TAuthContext} from 'core-logic/api/auth/AuthProvider';
import {
  useCurrentCollectivite,
  CurrentCollectivite,
} from 'core-logic/hooks/useCurrentCollectivite';

export const Header = ({
  auth,
  currentCollectivite,
}: {
  auth: TAuthContext;
  currentCollectivite: CurrentCollectivite | null;
}) => {
  const {isConnected, user} = auth;
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
              <HeaderNavigation isConnected={isConnected} user={user} />
              {isMobileNavigationOpen ? (
                <MobileNavigation
                  toggleMobileNavigation={toggleMobileNavigation}
                  collectivite={currentCollectivite}
                  isConnected={isConnected}
                  user={user}
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
        {currentCollectivite !== null && (
          <CollectiviteNavigation collectivite={currentCollectivite} />
        )}
      </header>
      <CollectiviteReadOnlyBanner collectivite={currentCollectivite} />
    </>
  );
};

const CollectiviteReadOnlyBanner = ({
  collectivite,
}: {
  collectivite: CurrentCollectivite | null;
}) => {
  if (!collectivite || collectivite.readonly)
    return (
      <div className="flex justify-center items-center bg-yellow-400 py-4 bg-opacity-70">
        <div className="text-sm mr-4">Lecture seule</div>
        <JoinCurrentCollectiviteDialog />
      </div>
    );
  return null;
};

export default () => {
  const auth = useAuth();
  const currentCollectivite = useCurrentCollectivite();
  return <Header auth={auth} currentCollectivite={currentCollectivite} />;
};
