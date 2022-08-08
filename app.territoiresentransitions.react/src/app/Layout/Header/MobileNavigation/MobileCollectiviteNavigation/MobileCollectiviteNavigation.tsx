import {NavLink} from 'react-router-dom';
import {useMemo} from 'react';
import {makeCollectiviteTableauBordUrl} from 'app/paths';
import {
  CollectiviteNavDropdown,
  CollectiviteNavItems,
  isSingleNavItemDropdown,
} from 'app/Layout/Header/makeCollectiviteNavItems';
import CollectiviteAccesChip from 'app/Layout/Header/CollectiviteNavigation/CollectiviteAccesChip';
import MobileCollectiviteNavigationDropdown from 'app/Layout/Header/MobileNavigation/MobileCollectiviteNavigation/MobileCollectiviteNavigationDropdown';
import {MesCollectivitesRead} from 'generated/dataLayer';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

type Props = {
  collectiviteNav: CollectiviteNavItems;
  currentCollectivite: CurrentCollectivite;
  ownedCollectivites: MesCollectivitesRead[];
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
      niveauAcces: currentCollectivite.niveau_acces,
      listPathsAndLabels: collectivitesWithoutCurrentCollectivite.map(
        collectivite => {
          return {
            label: collectivite.nom,
            path: makeCollectiviteTableauBordUrl({
              collectiviteId: collectivite.collectivite_id,
            }),
            niveauAcces: collectivite.niveau_acces,
          };
        }
      ),
    };
  }, [currentCollectivite, ownedCollectivites]);

  return (
    <>
      {collectivites.listPathsAndLabels.length === 0 ? (
        <div className="flex items-center p-4">
          <span className="mr-auto">{collectivites.menuLabel}</span>
          <CollectiviteAccesChip
            acces={currentCollectivite.niveau_acces}
            className="ml-4"
          />
        </div>
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
