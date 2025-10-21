import { isNavDropdown, NavDropdown, NavItem, NavLink } from '@/ui';

type AddtionalProps = {
  hideWhenConfidentiel?: boolean;
  hideFromVisitor?: boolean;
  hideWhenNotSupport?: boolean;
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
    .filter((item) => !item.hideWhenConfidentiel)
    .filter((item) => !item.hideFromVisitor)
    .filter((item) => !item.hideWhenNotSupport)
    .map(
      ({
        hideFromVisitor,
        hideWhenConfidentiel,
        hideWhenNotSupport,
        ...item
      }) => {
        return isNavDropdown(item)
          ? {
              ...item,
              links: filterItems(item.links) as NavLink[],
            }
          : {
              ...item,
            };
      }
    );
