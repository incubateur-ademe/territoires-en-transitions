import { Header as HeaderTet, HeaderMainNav } from '@tet/ui';
import { useHeaderNav } from './use-header-nav';

export const APP_HEADER_ID = 'app-header';

export const Header = ({
  isMainNavDetached,
}: {
  isMainNavDetached?: boolean;
}) => {
  const { pathname, rootUrl, mainNav, secondaryNav } = useHeaderNav();

  return (
    <HeaderTet
      id={APP_HEADER_ID}
      pathname={pathname}
      rootUrl={rootUrl}
      mainNav={mainNav}
      secondaryNav={secondaryNav}
      isMainNavDetached={isMainNavDetached}
    />
  );
};

/** La navigation principale rendue hors du header (cf. `isMainNavDetached`). */
export const AppMainNav = ({ className }: { className?: string }) => {
  const { pathname, mainNav } = useHeaderNav();

  if (!mainNav) {
    return null;
  }

  return (
    <HeaderMainNav pathname={pathname} mainNav={mainNav} className={className} />
  );
};
