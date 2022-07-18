import {useState} from 'react';
import {Link} from 'react-router-dom';
import {TAuthContext, useAuth} from 'core-logic/api/auth/AuthProvider';
import MobileHeaderNavigation from './MobileHeaderNavigation/MobileHeaderNavigation';
import MobileCollectiviteNavigation from './MobileCollectiviteNavigation';
import {CollectiviteNavItems} from '../makeCollectiviteNavItems';
import {MesCollectivitesRead} from 'generated/dataLayer';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {allCollectivitesPath} from 'app/paths';

type Props = {
  auth: TAuthContext;
  collectiviteNav: CollectiviteNavItems | null;
  currentCollectivite: CurrentCollectivite | null;
  ownedCollectivites: MesCollectivitesRead[] | null;
};

const MobileNavigation = ({
  auth,
  collectiviteNav,
  currentCollectivite,
  ownedCollectivites,
}: Props) => {
  const {isConnected} = useAuth();

  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const toggleMobileNavigation = () =>
    setIsMobileNavigationOpen(!isMobileNavigationOpen);

  return (
    <>
      {isMobileNavigationOpen ? (
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
            {currentCollectivite !== null &&
              ownedCollectivites !== null &&
              collectiviteNav !== null && (
                <MobileCollectiviteNavigation
                  collectiviteNav={collectiviteNav}
                  currentCollectivite={currentCollectivite}
                  ownedCollectivites={ownedCollectivites}
                  toggleMobileNavigation={toggleMobileNavigation}
                />
              )}
            {isConnected && (
              <Link
                to={allCollectivitesPath}
                onClick={toggleMobileNavigation}
                className="fr-link w-full !p-4"
              >
                Collectivités engagées
              </Link>
            )}
            <a
              data-test="help"
              className="fr-link block w-full !p-4"
              href="https://aide.territoiresentransitions.fr/fr/"
              target="_blank"
            >
              <div className="fr-fi-question-line mr-2" />
              Aide
            </a>
            <MobileHeaderNavigation
              auth={auth}
              toggleMobileNavigation={toggleMobileNavigation}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={toggleMobileNavigation}
          className="fr-fi-menu-fill absolute top-6 right-6 z-10 lg:hidden"
        />
      )}
    </>
  );
};

export default MobileNavigation;
