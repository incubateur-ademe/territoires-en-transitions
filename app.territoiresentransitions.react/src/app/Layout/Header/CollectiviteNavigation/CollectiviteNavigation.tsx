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
          {/* <div className="group relative flex ml-auto">
            {collectivitesDropdown.listPathsAndLabels.length === 0 ? (
              <p className="flex items-center p-4 text-sm font-bold">
                {collectivitesDropdown.menuLabel}
              </p>
            ) : (
              <>
                <div className="relative m-2">
                  <div className="relative border border-gray-300">
                    <button className="flex items-center py-2 pl-4 pr-3 font-bold">
                      {collectivitesDropdown.menuLabel}
                      <div className="ml-2 mt-1 fr-fi-arrow-down-s-line scale-75 group-focus-within:rotate-180" />
                    </button>
                  </div>
                  <nav className="invisible absolute right-0 top-full min-w-full w-max transition-all opacity-0 border border-gray-300 drop-shadow-md bg-white group-focus-within:visible group-focus-within:translate-y-1 group-focus-within:opacity-100 z-50">
                    <p className="px-3 py-2 italic text-sm text-gray-600">
                      {collectivitesDropdown.listPathsAndLabels.length > 1
                        ? 'Mes collectivités'
                        : 'Ma collectivité'}
                    </p>
                    <ul>
                      {collectivitesDropdown.listPathsAndLabels.map(
                        labelAndPathSuffix => (
                          <li
                            className="fr-nav__item"
                            key={labelAndPathSuffix.label}
                          >
                            <Link
                              className="fr-nav__link !py-2"
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
                </div>
              </>
            )}
          </div> */}
        </nav>
      </div>
    </div>
  );
};

export default CollectiviteNavigation;
