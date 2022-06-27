import {NavLink} from 'react-router-dom';
import {useMemo} from 'react';
import {CurrentCollectiviteObserved} from 'core-logic/observables';
import {
  CollectiviteNavDropdown,
  CollectiviteNavSingle,
  isSingleNavItemDropdown,
} from '../../Header';
import MobileCollectiviteNavigationDropdown from './MobileCollectiviteNavigationDropdown';
import {makeCollectiviteTableauBordUrl} from 'app/paths';

type Props = {
  collectiviteNav: (CollectiviteNavSingle | CollectiviteNavDropdown)[];
  currentCollectivite: CurrentCollectiviteObserved;
  ownedCollectivites: CurrentCollectiviteObserved[];
  toggleMobileNavigation: () => void;
};

const MobileCollectiviteNavigation = ({
  collectiviteNav,
  currentCollectivite,
  ownedCollectivites,
  toggleMobileNavigation,
}: Props) => {
  const collectivitesDropdown: CollectiviteNavDropdown = useMemo(() => {
    const collectivitesWithoutCurrentCollectivite = ownedCollectivites.filter(
      e => currentCollectivite && e.nom !== currentCollectivite.nom
    );

    return {
      isSelectCollectivite: true,
      menuLabel: currentCollectivite.nom,
      listPathsAndLabels: collectivitesWithoutCurrentCollectivite.map(
        collectivite => {
          return {
            label: collectivite.nom,
            path: makeCollectiviteTableauBordUrl({
              collectiviteId: collectivite.collectivite_id,
            }),
          };
        }
      ),
    };
  }, [currentCollectivite, ownedCollectivites]);

  return (
    <>
      <MobileCollectiviteNavigationDropdown
        item={collectivitesDropdown}
        handleCloseMobileNavigation={toggleMobileNavigation}
      />
      {collectiviteNav.map(item =>
        isSingleNavItemDropdown(item) ? (
          <div key={item.menuLabel}>
            <MobileCollectiviteNavigationDropdown
              item={item}
              handleCloseMobileNavigation={toggleMobileNavigation}
            />
          </div>
        ) : (
          <div key={item.label}>
            <NavLink
              className="block p-4 font-bold"
              activeClassName="border-l-4 border-bf500 text-bf500"
              to={item.path}
              onClick={toggleMobileNavigation}
            >
              {item.label}
            </NavLink>
          </div>
        )
      )}
    </>
  );
};

export default MobileCollectiviteNavigation;
