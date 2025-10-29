import Link from 'next/link';

import { cn } from '@/ui/utils/cn';
import { HeaderProps } from '../Header';
import { HeaderDesktopMainNavItem } from './header-desktop.main-nav-item';
import { HeaderDesktopSecondaryNavItem } from './header-desktop.secondary-nav-item';

export const HEADER_MAIN_NAV_ID = 'header-main-nav';

type Props = HeaderProps & {
  className?: string;
};

const HeaderDesktop = ({
  pathname,
  logos,
  rootUrl,
  mainNav,
  secondaryNav,
  className,
}: Props) => {
  return (
    <>
      {/** Partie supérieure du header */}
      <HeaderContainer className={cn('justify-between py-2', className)}>
        {/** Lien vers la page d'accueil */}
        <Link
          href={rootUrl ?? '/'}
          className="bg-none hover:!bg-primary-1 rounded-lg"
        >
          {!!logos && (
            <div className="flex h-20 gap-8 p-1">
              {logos.map((logo, i) => (
                <div key={i} className="[&>svg]:h-full">
                  {logo}
                </div>
              ))}
            </div>
          )}
        </Link>
        {/** Navigation secondaire */}
        {!!secondaryNav && (
          <nav className="flex gap-2">
            {secondaryNav.map((item, i) => (
              <HeaderDesktopSecondaryNavItem key={i} item={item} />
            ))}
          </nav>
        )}
      </HeaderContainer>
      {/** Navigation principale */}
      {mainNav && (
        <>
          <div className="h-px bg-primary-3" />
          <HeaderContainer
            id={HEADER_MAIN_NAV_ID}
            className={cn('text-sm text-primary-9', className)}
          >
            {mainNav.startItems.map((item, i) => (
              <HeaderDesktopMainNavItem
                key={i}
                item={item}
                pathname={pathname}
              />
            ))}
            {mainNav.endItems && (
              <div className="ml-auto flex items-center">
                {mainNav.endItems.map((item, i) => (
                  <HeaderDesktopMainNavItem
                    key={i}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </div>
            )}
          </HeaderContainer>
        </>
      )}
    </>
  );
};

export default HeaderDesktop;

const HeaderContainer = ({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    id={id}
    className={cn('w-full max-w-8xl mx-auto px-6 flex items-center', className)}
  >
    {children}
  </div>
);
