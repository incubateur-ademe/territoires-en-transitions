import * as R from 'ramda';
import {Link, useLocation} from 'react-router-dom';
import {CollectiviteNavDropdown} from '../../Header';
import {_activeTabStyle} from '../CollectiviteNavigation';

const CollectiviteNavigationDropdownTab = (props: {
  item: CollectiviteNavDropdown;
}) => {
  const location = useLocation();
  const activePath = R.find(
    ({path}) => location.pathname === path,
    props.item.listPathsAndLabels
  )?.path;

  // Remove focus thus close the menu.
  // Since we are below useLocation it happens only when location change.
  if (document.activeElement instanceof HTMLElement)
    document.activeElement.blur();

  return (
    <div className="group relative">
      <div className={_activeTabStyle(!!activePath)}>
        <button className="flex items-center p-4 group-focus-within:bg-bf925">
          {props.item.menuLabel}
          <div className="ml-2 mt-1 fr-fi-arrow-down-s-line scale-75 group-focus-within:rotate-180" />
        </button>
      </div>
      <nav className="bg-white invisible absolute left-0 top-full min-w-full w-max transition-all opacity-0 drop-shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        <ul>
          {props.item.listPathsAndLabels.map(labelAndPathSuffix => (
            <li className="fr-nav__item" key={labelAndPathSuffix.label}>
              <Link
                className={`fr-nav__link ${_activeTabStyle(
                  labelAndPathSuffix.path === activePath
                )}`}
                to={labelAndPathSuffix.path}
              >
                <span className="block px-3 max-w-xs">
                  {labelAndPathSuffix.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default CollectiviteNavigationDropdownTab;
