import { cn } from '@/ui/utils/cn';
import { MouseEvent, useState } from 'react';
import { Button } from '../../Button/Button';
import { Icon } from '../../Icon';
import { NavDropdown as NavDropdownTypes, NavLink } from '../types';
import { isActiveNavDropdown, isActiveNavLink } from '../utils';

type CommonProps = {
  closeNav: () => void;
  pathname?: string;
};

type NavDropdownProps = CommonProps & {
  item: NavDropdownTypes;
};

export const HeaderMobileNavDropdown = ({
  item,
  closeNav,
  pathname,
}: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const isActive = isActiveNavDropdown({
    links: item.links.map((link) => link.href.toString()),
    pathname,
  });

  return (
    <>
      <button
        className={cn(
          'relative w-full flex items-center justify-between px-6 py-4',
          {
            'bg-primary-1': isOpen,
          }
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isActive && <ActiveBar />}
        <div className="grow flex items-center gap-2">
          {!!item.icon && <Icon icon={item.icon} />}
          <span className="text-left line-clamp-1">{item.children}</span>
        </div>
        <Icon icon={isOpen ? 'arrow-up-s-line' : 'arrow-down-s-line'} />
      </button>
      {isOpen && (
        <div className="flex flex-col px-6">
          {item.links.map((link, i) => (
            <HeaderMobileNavLink
              key={i}
              item={link}
              closeNav={closeNav}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </>
  );
};

type NavLinkProps = CommonProps & {
  item: NavLink;
};

export const HeaderMobileNavLink = ({
  item,
  closeNav,
  pathname,
}: NavLinkProps) => {
  const { urlPrefix, ...link } = item;

  const isActive = isActiveNavLink({
    href: link.href.toString(),
    pathname,
    urlPrefix,
  });

  return (
    <div className="relative">
      {isActive && <ActiveBar />}
      <Button
        variant="unstyled"
        className="w-full flex flex-row items-center gap-2 px-6 py-4"
        {...link}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          item.onClick?.(e);
          closeNav();
        }}
      />
    </div>
  );
};

const ActiveBar = () => (
  <div className="absolute left-1 inset-y-2 w-0.5 bg-primary-9" />
);
