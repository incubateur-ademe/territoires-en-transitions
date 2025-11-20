'use client';

import { ENV } from '@tet/api/environmentVariables';
import { useCollectiviteInfo } from '@/panier/components/Landing/useCollectiviteInfo';
import useLandingPathname from '@/panier/hooks/useLandingPathname';
import { usePanierContext } from '@/panier/providers';
import { Header as HeaderTet, SITE_BASE_URL } from '@tet/ui';
import { NavItem } from '@tet/ui/design-system/Header/types';

const Header = () => {
  const landingPathname = useLandingPathname();
  const { panier } = usePanierContext();
  const { data: collectiviteInfo } = useCollectiviteInfo(
    panier?.collectivite_id ?? panier?.collectivite_preset ?? null
  );

  const getSecondaryNav = () => {
    const whoAreWe: NavItem = {
      children: 'Qui sommes-nous ?',
      href: `${SITE_BASE_URL}/outil-numerique`,
      external: true,
    };

    if (!collectiviteInfo) {
      return [whoAreWe];
    }

    const collectiviteWelcomePage: NavItem = {
      children: collectiviteInfo.nom,
      href: collectiviteInfo.isOwnCollectivite
        ? `${ENV.app_url}/collectivite/${collectiviteInfo.collectivite_id}/accueil`
        : '',
      disabled: !collectiviteInfo.isOwnCollectivite,
    };

    return [whoAreWe, collectiviteWelcomePage];
  };

  return (
    <HeaderTet rootUrl={landingPathname} secondaryNav={getSecondaryNav()} />
  );
};

export default Header;
