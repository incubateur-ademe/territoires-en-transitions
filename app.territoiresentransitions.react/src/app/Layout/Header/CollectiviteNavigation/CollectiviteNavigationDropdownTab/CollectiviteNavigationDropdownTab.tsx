import classNames from 'classnames';
import {forwardRef, Ref} from 'react';
import {Link, useLocation} from 'react-router-dom';
import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {CollectiviteNavDropdown} from '../../makeCollectiviteNavItems';
import {activeTabClassName} from '../CollectiviteNavigation';

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
    <>
      <DropdownFloater
        placement="bottom-start"
        render={({close}) => (
          <ul className="m-0 p-0">
            {props.item.listPathsAndLabels.map(labelAndPathSuffix => (
              <li className="fr-nav__item pb-0" key={labelAndPathSuffix.label}>
                <Link
                  className={classNames('fr-nav__link !shadow-none', {
                    [activeTabClassName]: isActivePath(
                      labelAndPathSuffix.path,
                      labelAndPathSuffix.alternativeActivePath
                    ),
                  })}
                  to={labelAndPathSuffix.path}
                  onClick={close}
                >
                  <span className="block px-3 max-w-xs">
                    {labelAndPathSuffix.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      >
        <CollectiviteNavigationDropdownButtonDisplayed
          isActive={isActiveTitle}
          menuLabel={props.item.menuLabel}
        />
      </DropdownFloater>
    </>
  );
};

export default CollectiviteNavigationDropdownTab;

const CollectiviteNavigationDropdownButtonDisplayed = forwardRef(
  (
    {
      isActive,
      menuLabel,
      isOpen,
      ...props
    }: {
      isActive: boolean;
      menuLabel: string;
      isOpen?: boolean;
    },
    ref?: Ref<HTMLDivElement>
  ) => (
    <div
      ref={ref}
      className={classNames('flex', {[activeTabClassName]: isActive})}
      {...props}
    >
      <button
        className={classNames('flex items-center p-4', {'bg-bf925': isOpen})}
      >
        {menuLabel}
        <div
          className={classNames('ml-2 mt-1 fr-fi-arrow-down-s-line scale-75', {
            'rotate-180': isOpen,
          })}
        />
      </button>
    </div>
  )
);
