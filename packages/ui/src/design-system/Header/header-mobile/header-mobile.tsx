import classNames from 'classnames';
import Link from 'next/link';
import { useState } from 'react';
import { useLockBodyScroll } from 'react-use';
import { Button } from '../../Button/Button';
import { HeaderProps } from '../Header';
import { isNavDropdown, isNavLink } from '../types';
import {
  HeaderMobileNavDropdown,
  HeaderMobileNavLink,
} from './header-mobile.nav-item';

type Props = HeaderProps & {
  className?: string;
};

const HeaderMobile = ({
  pathname,
  logos,
  rootUrl,
  mainNav = { startItems: [], endItems: [] },
  secondaryNav = [],
  className,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  useLockBodyScroll(isOpen);

  return (
    <div
      className={classNames('bg-white', className, {
        'fixed inset-0 h-screen w-screen overflow-y-auto z-modal': isOpen,
      })}
    >
      <div className="flex justify-between items-start">
        <Link href={rootUrl ?? '/'} className="flex items-center h-24 bg-none">
          {[0, 1].map((i) => logos?.[i])}
        </Link>
        <Button
          icon={isOpen ? 'close-line' : 'menu-line'}
          size="xl"
          variant="white"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      <div className="h-px shrink-0 bg-primary-3" />
      {isOpen ? (
        [
          ...mainNav.startItems,
          ...(mainNav.endItems ?? []),
          ...secondaryNav,
        ].map((item, i) => (
          <div
            key={i}
            className="flex flex-col w-full text-primary-9 border-b border-grey-3 last:border-none"
          >
            {isNavDropdown(item) && (
              <HeaderMobileNavDropdown
                item={item}
                closeNav={() => setIsOpen(false)}
                pathname={pathname}
              />
            )}
            {isNavLink(item) && (
              <HeaderMobileNavLink
                item={item}
                closeNav={() => setIsOpen(false)}
                pathname={pathname}
              />
            )}
          </div>
        ))
      ) : (
        <div className="my-3 text-center">
          <h4 className="mb-1 text-primary-8">Territoires en transitions</h4>
          <p className="mb-0 text-sm text-grey-8">
            Accompagner la transition écologique des collectivités
          </p>
        </div>
      )}
    </div>
  );
};

export default HeaderMobile;
