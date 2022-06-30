import {useMemo} from 'react';
import {Link, NavLink} from 'react-router-dom';
import CollectiviteNavigationDropdownTab from './CollectiviteNavigationDropdownTab';
import {makeCollectiviteTableauBordUrl} from 'app/paths';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {
  CollectiviteNavDropdown,
  CollectiviteNavItems,
  isSingleNavItemDropdown,
} from '../makeCollectiviteNavItems';
import {OwnedCollectiviteRead} from 'generated/dataLayer';

export const activeTabClassName = 'border-b-2 border-bf500';

export const _activeTabStyle = (active: boolean): string =>
  `${active ? activeTabClassName : ''}`;

type Props = {
  collectiviteNav: CollectiviteNavItems;
  currentCollectivite: CurrentCollectivite;
  ownedCollectivites: OwnedCollectiviteRead[];
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
                className="fr-nav__item justify-center p-4"
                activeClassName={activeTabClassName}
                to={item.path}
              >
                {item.label}
              </NavLink>
            )
          )}
          <div className="group relative flex ml-auto">
            {collectivitesDropdown.listPathsAndLabels.length === 0 ? (
              <p className="flex items-center p-4 text-sm font-bold">
                {collectivitesDropdown.menuLabel}
              </p>
            ) : (
              <>
                <button className="flex items-center p-4 font-bold group-focus-within:bg-bf925">
                  {collectivitesDropdown.menuLabel}
                  <div className="ml-2 mt-1 fr-fi-arrow-down-s-line scale-75 group-focus-within:rotate-180" />
                </button>
                <nav className="bg-white invisible absolute left-0 top-full min-w-full w-max transition-all opacity-0 drop-shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
                  <ul>
                    {collectivitesDropdown.listPathsAndLabels.map(
                      labelAndPathSuffix => (
                        <li
                          className="fr-nav__item"
                          key={labelAndPathSuffix.label}
                        >
                          <Link
                            className="fr-nav__link"
                            to={labelAndPathSuffix.path}
                          >
                            <span className="block px-3 max-w-xs">
                              {labelAndPathSuffix.label}
                            </span>
                          </Link>
                        </li>
                      )
                    )}
                  </ul>
                </nav>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default CollectiviteNavigation;
