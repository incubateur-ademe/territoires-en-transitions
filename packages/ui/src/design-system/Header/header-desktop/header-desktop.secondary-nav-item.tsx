import { cn } from '@/ui/utils/cn';
import { useState } from 'react';
import { Button, ButtonMenu } from '../../Button';
import { isNavDropdown, isNavLink, NavItem } from '../types';

export const HeaderDesktopSecondaryNavItem = ({ item }: { item: NavItem }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (isNavDropdown(item)) {
    return (
      <ButtonMenu
        text={item.children}
        icon={item.icon}
        iconPosition="left"
        variant="white"
        size="sm"
        className={item.className}
        menuContainerClassName="z-tooltip"
        withArrow
        openState={{ isOpen, setIsOpen }}
      >
        <div className="flex flex-col text-center">
          {item.links.map((link, idx) => (
            <Button
              key={idx}
              variant="unstyled"
              className={cn(
                'p-3 text-sm border-b last:border-none border-grey-4',
                {
                  'cursor-not-allowed opacity-50': link.disabled,
                  'hover:!bg-primary-1': !link.disabled,
                }
              )}
              {...link}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                link.onClick?.(e);
                setIsOpen(false);
              }}
            />
          ))}
        </div>
      </ButtonMenu>
    );
  }
  if (isNavLink(item)) {
    return <Button variant="white" size="sm" iconPosition="left" {...item} />;
  }
};
