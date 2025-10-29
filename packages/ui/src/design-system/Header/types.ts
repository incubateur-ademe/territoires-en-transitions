import { AnchorButtonProps } from '../Button';

export type NavLink = AnchorButtonProps & {
  urlPrefix?: string[];
};

export type NavDropdown = {
  children: string | React.ReactNode;
  links: NavLink[];
  icon?: string;
  dataTest?: string;
  className?: string;
  urlPrefix?: string[];
};

export type NavItem = NavLink | NavDropdown;

export function isNavDropdown(item: NavItem): item is NavDropdown {
  return (item as NavDropdown).links !== undefined;
}
export function isNavLink(item: NavItem): item is NavLink {
  return (item as NavLink).href !== undefined;
}
