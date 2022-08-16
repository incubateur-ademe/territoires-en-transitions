import {NavLink} from 'react-router-dom';
import CollectiviteNavigationDropdownTab from './CollectiviteNavigationDropdownTab';
import {
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
