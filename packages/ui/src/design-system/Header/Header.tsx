import { DSFRCompliancyComponent } from '../../components/DSFRCompliancyComponent';
import HeaderDesktop from './header-desktop/header-desktop';
import HeaderMobile from './header-mobile/header-mobile';
import { NavItem } from './types';

export type HeaderProps = {
  /** Url de la page courante, pour indiquer l'élément actif dans la navigation */
  pathname?: string;
  /** Url custom lors du clic sur les logos */
  rootUrl?: string;
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
        mainNav={mainNav}
        secondaryNav={secondaryNav}
      />
      <HeaderMobile
        className="lg:hidden"
        rootUrl={rootUrl}
        pathname={pathname}
        mainNav={mainNav}
        secondaryNav={secondaryNav}
      />
      <DSFRCompliancyComponent />
    </header>
  );
};
