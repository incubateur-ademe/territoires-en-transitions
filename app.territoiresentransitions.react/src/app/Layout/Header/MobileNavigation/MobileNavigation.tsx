import {useState} from 'react';
import {CurrentCollectiviteObserved} from 'core-logic/observables';
import {CollectiviteNavDropdown, CollectiviteNavSingle} from '../Header';
import MobileHeaderNavigation from './MobileHeaderNavigation/MobileHeaderNavigation';
import MobileCollectiviteNavigation from './MobileCollectiviteNavigation';
import {User} from '@supabase/supabase-js';

type Props = {
  isConnected: boolean;
  user: User | null;
  collectiviteNav: (CollectiviteNavSingle | CollectiviteNavDropdown)[];
  currentCollectivite: CurrentCollectiviteObserved | null;
  ownedCollectivites: CurrentCollectiviteObserved[] | null;
};

const MobileNavigation = ({
  isConnected,
  user,
  collectiviteNav,
  currentCollectivite,
  ownedCollectivites,
}: Props) => {
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
            {currentCollectivite !== null && ownedCollectivites !== null && (
              <MobileCollectiviteNavigation
                collectiviteNav={collectiviteNav}
                currentCollectivite={currentCollectivite}
                ownedCollectivites={ownedCollectivites}
                toggleMobileNavigation={toggleMobileNavigation}
              />
            )}

            <a
              data-test="help"
              className="fr-link block w-full !p-4"
              href="https://aide.territoiresentransitions.fr/fr/"
            >
              <div className="fr-fi-question-line mr-2" />
              Aide
            </a>
            <MobileHeaderNavigation
              isConnected={isConnected}
              user={user}
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
