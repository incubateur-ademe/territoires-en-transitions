import { Button, ButtonMenu } from '../../Button';
import { isNavDropdown, isNavLink, NavItem } from '../types';

export const HeaderDesktopSecondaryNavItem = ({ item }: { item: NavItem }) => {
  if (isNavDropdown(item)) {
    return (
      <ButtonMenu
        icon={item.icon}
        iconPosition="left"
        variant="white"
        size="sm"
        className={item.className}
        withArrow
        dataTest={item.dataTest}
        menu={{
          className: 'z-tooltip',
          actions: item.links.map((link) => ({
            label: link.children,
            href: link.href,
            onClick: link.onClick,
            disabled: link.disabled,
          })),
        }}
      >
        {item.children}
      </ButtonMenu>
    );
  }
  if (isNavLink(item)) {
    return <Button variant="white" size="sm" iconPosition="left" {...item} />;
  }
};
