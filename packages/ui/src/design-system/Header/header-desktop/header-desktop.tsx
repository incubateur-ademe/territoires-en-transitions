import Link from 'next/link';

import { AdemeLogo } from '../../../assets/ademe.logo';
import { ProgrammeTeTeLogo } from '../../../assets/programme-tete.logo';
import { RepubliqueFrancaiseLogo } from '../../../assets/republique-francaise.logo';
import { TerritoiresEnTransitionsLogo } from '../../../assets/territoires-en-transitions.logo';
import { cn } from '../../../utils/cn';
import { HeaderProps } from '../Header';
import { HeaderDesktopMainNavItem } from './header-desktop.main-nav-item';
import { HeaderDesktopSecondaryNavItem } from './header-desktop.secondary-nav-item';

export const HEADER_MAIN_NAV_ID = 'header-main-nav';

type Props = HeaderProps & {
  className?: string;
};

const HeaderDesktop = ({
  pathname,
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
          <div className="flex gap-4">
            <RepubliqueFrancaiseLogo className="h-20" />
            <AdemeLogo className="h-20" />
            <ProgrammeTeTeLogo className="h-20" />
            <TerritoiresEnTransitionsLogo className="h-14 my-auto" />
          </div>
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
