import { ProgrammeTeteLogo } from '@/ui/assets/programme-tete.logo';
import { AdemeLogo } from '../../assets/ademe.logo';
import { RepubliqueFrancaiseLogo } from '../../assets/republique-francaise.logo';
import { TerritoiresEnTransitionsLogo } from '../../assets/territoires-en-transitions.logo';
import HeaderDesktop from './header-desktop/header-desktop';
import HeaderMobile from './header-mobile/header-mobile';
import { NavItem } from './types';

export type HeaderProps = {
  /** Url de la page courante, pour indiquer l'élément actif dans la navigation */
  pathname?: string;
  /** Url custom lors du clic sur les logos */
  rootUrl?: string;
  /** Liste de logos à afficher à gauche du header. */
  logos?: React.ReactNode[];
  mainNav?: {
    startItems: NavItem[];
    endItems?: NavItem[];
  };
  secondaryNav?: NavItem[];
  id?: string;
};

export const Header = ({
  pathname,
  rootUrl = '/',
  logos = [
    <RepubliqueFrancaiseLogo className="h-full" />,
    <AdemeLogo className="h-full" />,
    <ProgrammeTeteLogo className="h-full" />,
    <TerritoiresEnTransitionsLogo className="h-full" />,
  ],
  mainNav,
  secondaryNav,
  id,
}: HeaderProps) => {
  return (
    <header
      id={id}
      className="relative w-full bg-white border-b border-primary-3 z-modal"
    >
      <HeaderDesktop
        className="max-lg:hidden"
        rootUrl={rootUrl}
        pathname={pathname}
        logos={logos}
        mainNav={mainNav}
        secondaryNav={secondaryNav}
      />
      <HeaderMobile
        className="lg:hidden"
        rootUrl={rootUrl}
        pathname={pathname}
        logos={logos}
        mainNav={mainNav}
        secondaryNav={secondaryNav}
      />
    </header>
  );
};
