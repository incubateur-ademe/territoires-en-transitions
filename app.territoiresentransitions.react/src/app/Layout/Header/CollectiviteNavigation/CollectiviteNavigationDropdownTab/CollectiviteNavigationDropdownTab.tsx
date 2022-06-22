import * as R from 'ramda';
import {Link, useLocation} from 'react-router-dom';
import {_activeTabStyle} from '../CollectiviteNavigation';

const CollectiviteNavigationDropdownTab = (props: {
  menuLabel: string;
  listPathsAndLabels: {path: string; label: string}[];
}) => {
  const location = useLocation();
  const activePath = R.find(
    ({path}) => location.pathname === path,
    props.listPathsAndLabels
  )?.path;

  // Remove focus thus close the menu.
  // Since we are below useLocation it happens only when location change.
  if (document.activeElement instanceof HTMLElement)
    document.activeElement.blur();

  return (
    <div className="group relative">
      <div className={_activeTabStyle(!!activePath)}>
        <button className="p-4">{props.menuLabel}</button>
      </div>
      <nav className="bg-white invisible absolute left-0 top-full transition-all opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        <ul>
          {props.listPathsAndLabels.map(labelAndPathSuffix => (
            <li className="fr-nav__item" key={labelAndPathSuffix.label}>
              <Link
                className={`fr-nav__link whitespace-nowrap ${_activeTabStyle(
                  labelAndPathSuffix.path === activePath
                )}`}
                to={labelAndPathSuffix.path}
              >
                <span className="px-3">{labelAndPathSuffix.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default CollectiviteNavigationDropdownTab;
