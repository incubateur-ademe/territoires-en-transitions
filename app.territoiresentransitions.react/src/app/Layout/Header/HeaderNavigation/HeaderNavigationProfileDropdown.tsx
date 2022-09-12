import {forwardRef, Ref} from 'react';
import {NavLink} from 'react-router-dom';
import classNames from 'classnames';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {activeTabClassName} from 'app/Layout/Header/CollectiviteNavigation/CollectiviteNavigation';
import {monComptePath} from 'app/paths';
import {TAuthContext, UserData} from 'core-logic/api/auth/AuthProvider';
import {LogoutBtn} from '../LogoutBtn';

const HeaderNavigationProfileDropdown = ({
  user,
  auth,
}: {
  user: UserData;
  auth: TAuthContext;
}) => {
  return (
    <>
      <DropdownFloater
        placement="bottom-start"
        render={({close}) => (
          <nav>
            <ul className="m-0 p-0">
              <li className="fr-nav__item pb-0 border-b border-gray-200">
                <NavLink
                  to={monComptePath}
                  className="fr-nav__link before:!hidden !shadow-none"
                  activeClassName={activeTabClassName}
                  onClick={close}
                >
                  <span className="px-3">Profil</span>
                </NavLink>
              </li>
              <li className="fr-nav__item pb-0">
                <LogoutBtn auth={auth} />
              </li>
            </ul>
          </nav>
        )}
      >
        <HeaderNavigationProfileDropdownButtonDisplayed user={user} />
      </DropdownFloater>
    </>
  );
};

export default HeaderNavigationProfileDropdown;

const HeaderNavigationProfileDropdownButtonDisplayed = forwardRef(
  (
    {
      user,
      isOpen,
      ...props
    }: {
      isOpen?: boolean;
      user: UserData;
    },
    ref?: Ref<HTMLDivElement>
  ) => (
    <div ref={ref} {...props}>
      <button
        data-test="connectedMenu"
        className="fr-link"
        style={{maxWidth: '15rem'}}
      >
        <div className="fr-fi-account-line mr-2" />
        <span className="line-clamp-1">{user.prenom}</span>
        <div
          className={classNames('fr-fi-arrow-down-s-line ml-2 scale-90', {
            ['rotate-180']: isOpen,
          })}
        />
      </button>
    </div>
  )
);
