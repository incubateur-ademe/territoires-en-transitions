import {useMemo} from 'react';
import {Link, NavLink} from 'react-router-dom';
import CollectiviteNavigationDropdownTab from './CollectiviteNavigationDropdownTab';
import {makeCollectiviteTableauBordUrl} from 'app/paths';
import {
  CollectiviteNavDropdown,
  CollectiviteNavItems,
  isSingleNavItemDropdown,
} from '../makeCollectiviteNavItems';
import {MesCollectivitesRead} from 'generated/dataLayer';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import CollectiviteSwitchDropdown from './CollectiviteSwitchDropdown';

export const activeTabClassName = '!text-bf500 border-b-2 border-bf500';

type Props = {
  collectiviteNav: CollectiviteNavItems;
  currentCollectivite: CurrentCollectivite;
  ownedCollectivites: MesCollectivitesRead[];
};

const CollectiviteNavigation = ({
  collectiviteNav,
  currentCollectivite,
  ownedCollectivites,
}: Props) => {
  const collectivitesDropdown: CollectiviteNavDropdown = useMemo(() => {
    const collectivitesWithoutCurrentCollectivite = ownedCollectivites?.filter(
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

  console.log(collectivitesDropdown);

  return (
    <div className="fr-container hidden lg:block">
      <div className="flex flex-row justify-between">
        <nav
          className="flex flex-row w-full text-sm"
          aria-label="Menu principal"
        >
          {collectiviteNav.map(item =>
            isSingleNavItemDropdown(item) ? (
              <CollectiviteNavigationDropdownTab
                key={item.menuLabel}
                item={item}
              />
            ) : (
              <NavLink
                key={item.label}
                className="fr-nav__item justify-center text-center p-4"
                activeClassName={activeTabClassName}
                to={item.path}
              >
                {item.label}
              </NavLink>
            )
          )}
          <CollectiviteSwitchDropdown
            currentCollectivite={currentCollectivite}
            mesCollectivites={ownedCollectivites}
          />
        </nav>
      </div>
    </div>
  );
};

export default CollectiviteNavigation;
