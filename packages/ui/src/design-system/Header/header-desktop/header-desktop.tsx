import Link from 'next/link';

import { cn } from '@/ui/utils/cn';
import { HeaderProps } from '../Header';
import { HeaderDesktopMainNavItem } from './header-desktop.main-nav-item';
import { HeaderDesktopSecondaryNavItem } from './header-desktop.secondary-nav-item';

export const HEADER_DESKTOP_CONTAINER_CLASS =
  'w-full max-w-8xl mx-auto px-6 flex items-center';

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
      <div
        className={cn(
          HEADER_DESKTOP_CONTAINER_CLASS,
          'justify-between py-3',
          className
        )}
      >
        {/** Lien vers la page d'accueil */}
        <Link
          href={rootUrl ?? '/'}
          className="bg-none hover:!bg-primary-1 rounded-lg"
        >
          {!!logos && (
            <div className="flex h-20 xl:h-24 gap-8 p-1">
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
      </div>
      {/** Navigation principale */}
      {mainNav && (
        <>
          <div className="h-px bg-primary-3" />
          <div
            className={cn(
              HEADER_DESKTOP_CONTAINER_CLASS,
              'text-sm text-primary-9',
              className
            )}
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
          </div>
        </>
      )}
    </>
  );
};

export default HeaderDesktop;
