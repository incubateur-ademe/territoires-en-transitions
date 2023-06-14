import classNames from 'classnames';
import {useState} from 'react';
import {NavLink} from 'react-router-dom';

export type TSideNavLink = {
  link: string;
  displayName: string;
};

export type TSideNavSection = TSideNavLink & {
  enfants: TSideNavLink[];
};

export type SideNavLinks = (TSideNavLink | TSideNavSection)[];

// Type guards
export function isSideNavSection(
  element: TSideNavLink | TSideNavSection
): element is TSideNavSection {
  return (element as TSideNavSection).enfants !== undefined;
}

type Props = {
  links: SideNavLinks;
};

const SideNav = ({links}: Props) => {
  return (
    <nav data-test="SideNav" className="fr-sidemenu flex">
      <div className="fr-sidemenu-wrapper w-full">
        <ul className="fr-sidemenu__list">
          {links.map(element => {
            if (isSideNavSection(element)) {
              return <Section key={element.link} section={element} />;
            } else {
              return (
                <li
                  key={element.link}
                  className="fr-sidemnu__item fr-sidemenu__item--active"
                >
                  <NavLink
                    className="fr-sidemenu__link"
                    to={element.link}
                    target="_self"
                    aria-current="page"
                  >
                    {element.displayName}
                  </NavLink>
                </li>
              );
            }
          })}
        </ul>
      </div>
    </nav>
  );
};

export default SideNav;

type SectionProps = {
  section: TSideNavSection;
};

const Section = ({section}: SectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li key={section.link} data-test="SideNav-section">
      <div className="flex items-start w-full">
        <div className="w-full fr-sidemnu__item fr-sidemenu__item--active">
          <NavLink
            className="fr-sidemenu__link"
            to={section.link}
            target="_self"
            aria-current="page"
          >
            {section.displayName}
          </NavLink>
        </div>
        <div className="flex pt-2 mt-0.5 ml-2">
          <button
            data-test="SideNav-section-toggle-button"
            className="p-0.5"
            title="Ouvrir la section"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span
              className={classNames(
                'fr-fi-arrow-right-s-line before:scale-75 before:transition-transform',
                {'before:rotate-90': isOpen}
              )}
            />
          </button>
        </div>
      </div>
      {isOpen && (
        <ul
          data-test="SideNav-section-liens"
          className="mx-4 fr-sidemenu__list"
        >
          {section.enfants.map(enfant => (
            <li
              key={enfant.link}
              className="fr-sidemnu__item fr-sidemenu__item--active"
            >
              <NavLink
                className="fr-sidemenu__link"
                to={enfant.link}
                target="_self"
                aria-current="page"
              >
                {enfant.displayName}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};
