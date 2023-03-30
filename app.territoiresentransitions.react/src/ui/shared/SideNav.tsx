import {NavLink} from 'react-router-dom';

export type TSideNavLink = {
  link: string;
  displayName: string;
};

type Props = {
  links: TSideNavLink[];
};

const SideNav = ({links}: Props) => {
  return (
    <nav
      data-test="SideNav"
      className="fr-sidemenu flex w-80 shrink-0 py-8 md:px-8 border-r border-gray-100"
    >
      <div className="fr-sidemenu-wrapper">
        <ul className="fr-sidemenu_list">
          {links.map(link => (
            <li
              key={link.link}
              className="fr-sidemnu_item fr-sidemenu_item--active"
            >
              <NavLink
                className="fr-sidemenu__link"
                to={link.link}
                target="_self"
                aria-current="page"
              >
                {link.displayName}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default SideNav;
