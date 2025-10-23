import { isNavDropdown, NavDropdown, NavItem, NavLink } from '@/ui';

type AddtionalProps = {
  hide?: boolean;
};

export const filterItems = (
  items: (
    | (NavLink & AddtionalProps)
    | (NavDropdown &
        AddtionalProps & {
          links: NavDropdown['links'] & AddtionalProps[];
        })
  )[]
): NavItem[] =>
  items
    .filter((item) => !item.hide)
    .map(({ hide, ...item }) => {
      return isNavDropdown(item)
        ? {
            ...item,
            links: filterItems(item.links) as NavLink[],
          }
        : { ...item };
    });
