import {Link, useLocation} from 'react-router-dom';
import {CollectiviteNavDropdown} from '../../makeCollectiviteNavItems';
import {_activeTabStyle} from '../CollectiviteNavigation';

const CollectiviteNavigationDropdownTab = (props: {
  item: CollectiviteNavDropdown;
}) => {
  const location = useLocation();

  const isActiveTitle = props.item.listPathsAndLabels.some(
    ({path, alternativeActivePath}) =>
      location.pathname === path ||
      (alternativeActivePath &&
        alternativeActivePath.some(e => location.pathname === e))
  );

  const isActivePath = (path: string, alternativePath?: string[]) =>
    path === location.pathname ||
    (!!alternativePath && alternativePath.some(e => e === location.pathname));

  return (
    <div className="group relative">
      <div className={_activeTabStyle(isActiveTitle)}>
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
                  isActivePath(
                    labelAndPathSuffix.path,
                    labelAndPathSuffix.alternativeActivePath
                  )
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
