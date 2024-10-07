'use client';

import useLandingPathname from '@tet/panier/hooks/useLandingPathname';
import { Button, HeaderTeT, SITE_BASE_URL } from '@tet/ui';
import { getAppBaseUrl } from '@tet/api';
import { useCollectiviteInfo } from '@tet/panier/components/Landing/useCollectiviteInfo';
import { usePanierContext } from '@tet/panier/providers';

const Header = () => {
  const landingPathname = useLandingPathname();
  const { panier } = usePanierContext();
  const { data: collectiviteInfo } = useCollectiviteInfo(
    panier?.collectivite_id ?? panier?.collectivite_preset ?? null
  );

  return (
    <HeaderTeT
      customRootUrl={landingPathname}
      quickAccessButtons={(props) => {
        const buttons = [
          <Button
            {...props}
            key="outil"
            href={`${SITE_BASE_URL}/outil-numerique`}
            iconPosition="left"
            external
          >
            Qui sommes-nous ?
          </Button>,
        ];
        if (collectiviteInfo) {
          buttons.push(
            <Button
              {...props}
              key="nom"
              href={`${getAppBaseUrl(
                document.location.hostname
              )}/collectivite/${collectiviteInfo.collectivite_id}`}
            >
              {collectiviteInfo?.nom}
            </Button>
          );
        }
        return buttons;
      }}
    />
  );
};

export default Header;
