import {NavLink} from 'react-router-dom';
import {useMemo} from 'react';
import MobileCollectiviteNavigationDropdown from './MobileCollectiviteNavigationDropdown';
import {makeCollectiviteTableauBordUrl} from 'app/paths';
import {
  CollectiviteNavDropdown,
  CollectiviteNavItems,
  isSingleNavItemDropdown,
} from '../../makeCollectiviteNavItems';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {OwnedCollectiviteRead} from 'generated/dataLayer';

type Props = {
  collectiviteNav: CollectiviteNavItems;
  currentCollectivite: CurrentCollectivite;
  ownedCollectivites: OwnedCollectiviteRead[];
  toggleMobileNavigation: () => void;
};

const MobileCollectiviteNavigation = ({
  collectiviteNav,
  currentCollectivite,
  ownedCollectivites,
  toggleMobileNavigation,
}: Props) => {
  const collectivites: CollectiviteNavDropdown = useMemo(() => {
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
      {collectivites.listPathsAndLabels.length === 0 ? (
        <p className="flex items-center p-4">{collectivites.menuLabel}</p>
      ) : (
        <MobileCollectiviteNavigationDropdown
          item={collectivites}
          handleCloseMobileNavigation={toggleMobileNavigation}
        />
      )}
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
