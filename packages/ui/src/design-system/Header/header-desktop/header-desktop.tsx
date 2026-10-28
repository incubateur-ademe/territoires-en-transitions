import Link from 'next/link';

import { AdemeLogo } from '../../../assets/ademe.logo';
import { ElectrifionsLaFranceLogo } from '../../../assets/electrifions-la-france.logo';
import { ProgrammeTeTeLogo } from '../../../assets/programme-tete.logo';
import { RepubliqueFrancaiseLogo } from '../../../assets/republique-francaise.logo';
import { TerritoiresEnTransitionsLogo } from '../../../assets/territoires-en-transitions.logo';
import { cn } from '../../../utils/cn';
import { HeaderProps } from '../Header';
import { HeaderMainNav } from './header-desktop.main-nav';
import { HeaderDesktopSecondaryNavItem } from './header-desktop.secondary-nav-item';

type Props = HeaderProps & {
  className?: string;
};

const HeaderDesktop = ({
  pathname,
  rootUrl,
  mainNav,
  secondaryNav,
  isMainNavDetached,
  className,
}: Props) => {
  return (
    <>
      {/** Partie supérieure du header */}
      <HeaderContainer
        className={cn('flex-wrap justify-between gap-4 py-2', className)}
      >
        {/** Lien vers la page d'accueil */}
        {/* Le bloc-marque porte sa zone de protection dans son propre SVG : 20
            unités de vide à gauche d'un `viewBox` de 151 de haut, soit ~10px à
            la hauteur rendue (h-20). On les reprend pour que la Marianne tombe
            sur la gouttière, comme la navigation et le contenu. */}
        <Link
          href={rootUrl ?? '/'}
          className="-ml-[10px] bg-none hover:!bg-primary-1 rounded-lg"
        >
          <div className="flex gap-4">
            <RepubliqueFrancaiseLogo className="h-20" />
            <AdemeLogo className="h-20" />
            <ElectrifionsLaFranceLogo className="shrink-0 my-auto" />
            <ProgrammeTeTeLogo className="h-20" />
            <TerritoiresEnTransitionsLogo className="h-14 my-auto" />
          </div>
        </Link>
        {/** Navigation secondaire */}
        {!!secondaryNav && (
          /* Comme la navigation principale : le `px-4` du dernier item est
             repris, pour que le sur-menu s'aligne sur le bord droit. */
          <nav className="flex gap-2 ml-auto -mr-4">
            {secondaryNav.map((item, i) => (
              <HeaderDesktopSecondaryNavItem
                key={i}
                item={{ ...item, className: cn('py-2 px-4', item.className) }}
              />
            ))}
          </nav>
        )}
      </HeaderContainer>
      {/** Navigation principale */}
      {mainNav && !isMainNavDetached && (
        <>
          <div className="h-px bg-primary-3" />
          <HeaderMainNav
            pathname={pathname}
            mainNav={mainNav}
            className={className}
          />
        </>
      )}
    </>
  );
};

export default HeaderDesktop;

const HeaderContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn('w-full max-w-8xl mx-auto px-6 flex items-center', className)}
  >
    {children}
  </div>
);
