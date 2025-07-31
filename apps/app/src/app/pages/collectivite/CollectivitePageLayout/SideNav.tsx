import { Icon } from '@/ui';
import classNames from 'classnames';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

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

const SideNav = ({ links }: Props) => {
  return (
    <nav data-test="SideNav" className="flex !pr-4">
      <ul className="grow m-0">
        {links.map((element) =>
          isSideNavSection(element) ? (
            <Section key={element.link} section={element} />
          ) : (
            <li key={element.link} className="flex p-0">
              <NavLink href={element.link}>{element.displayName}</NavLink>
            </li>
          )
        )}
      </ul>
    </nav>
  );
};

export default SideNav;

type SectionProps = {
  section: TSideNavSection;
};

const Section = ({ section }: SectionProps) => {
  const pathname = usePathname();
  const isOpen =
    pathname === section.link || pathname.startsWith(`${section.link}/`);

  return (
    <li key={section.link} data-test="SideNav-section" className="p-0">
      <NavLink
        data-test="SideNav-section-toggle-button"
        title="Ouvrir la section"
        className="flex justify-between items-center"
        href={section.link}
      >
        {section.displayName}
        <Icon
          icon="arrow-right-s-line"
          className={classNames({ 'rotate-90': isOpen })}
        />
      </NavLink>
      {isOpen && (
        <ul data-test="SideNav-section-liens" className="mx-4 mb-4">
          {section.enfants.map((enfant) => (
            <li key={enfant.link} className="flex p-0">
              <NavLink href={enfant.link} className="font-normal">
                {enfant.displayName}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

/** Permet de gérer l'état actif et les props communes  */
const NavLink = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: () => void;
  dataTest?: string;
  title?: string;
}) => {
  const pathname = usePathname();

  const isActive =
    pathname === props.href || pathname.startsWith(`${props.href}/`);

  return (
    <Link
      className={classNames(
        'w-full py-3 px-4 font-bold bg-none hover:!bg-grey-2',
        className,
        {
          'text-primary-9 border-l-2 border-primary-9': isActive,
        }
      )}
      {...props}
    >
      {children}
    </Link>
  );
};
