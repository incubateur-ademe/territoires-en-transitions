import {
  autoUpdate,
  flip,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import { Fragment, useState } from 'react';

import { cn } from '@/ui/utils/cn';
import { Button } from '../../Button';
import { Icon } from '../../Icon';
import { isNavDropdown, NavDropdown, NavItem, NavLink } from '../types';
import { isActiveNavDropdown, isActiveNavLink } from '../utils';

export const HeaderDesktopMainNavItem = ({
  item,
  pathname,
}: {
  item: NavItem;
  pathname?: string;
}) => {
  if (isNavDropdown(item)) {
    return <HeaderDesktopDropdown dropdown={item} pathname={pathname} />;
  }
  return <HeaderDesktopLink link={item} pathname={pathname} />;
};

const HeaderDesktopDropdown = ({
  dropdown,
  pathname,
}: {
  dropdown: NavDropdown;
  pathname?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, context, x, y, strategy } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [flip(), offset(1)],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
  ]);

  const isActive = isActiveNavDropdown({
    links: dropdown.links.map((link) => link.href.toString()),
    pathname,
  });

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn('flex items-center gap-2 p-4 hover:!bg-primary-1', {
          'bg-primary-3 hover:!bg-primary-3': isOpen,
          'border-solid border-b-2 border-t-0 border-x-0 border-primary-9':
            isActive,
        })}
        data-test={dropdown.dataTest}
      >
        {dropdown.children}
        <Icon
          icon="arrow-down-s-line"
          size="sm"
          className={cn('transition', { 'rotate-180': isOpen })}
        />
      </button>
      {isOpen && (
        <div
          ref={refs.setFloating}
          {...getFloatingProps()}
          style={{
            position: strategy,
            top: y,
            left: x,
          }}
          className="flex flex-col w-80 shadow-[0_1px_5px_rgba(0,0,0,0.15)] bg-white rounded-b-md"
        >
          {dropdown.links.map((link, i) => (
            <Fragment key={i}>
              <HeaderDesktopLink
                key={i}
                pathname={pathname}
                link={{
                  ...link,
                  className: 'py-3',
                  onClick: () => setIsOpen(false),
                }}
                isDropdownLink
              />
              <div className="h-px shrink-0 mx-4 bg-grey-3 last:hidden" />
            </Fragment>
          ))}
        </div>
      )}
    </>
  );
};

const HeaderDesktopLink = ({
  link,
  isDropdownLink,
  pathname,
}: {
  link: NavLink;
  isDropdownLink?: boolean;
  pathname?: string;
}) => {
  const { urlPrefix, ...anchorProps } = link;

  const isActive = isActiveNavLink({
    href: link.href.toString(),
    pathname,
    urlPrefix,
  });

  return (
    <Button
      {...anchorProps}
      variant="unstyled"
      className={cn(
        'flex items-center gap-2 p-4 bg-none hover:!bg-primary-1',
        anchorProps.className,
        {
          'font-medium border-l-2 border-primary-9': isActive && isDropdownLink,
        },
        { 'border-b-2 border-primary-9': isActive && !isDropdownLink },
        { 'flex-row-reverse justify-end': anchorProps.external }
      )}
    />
  );
};
