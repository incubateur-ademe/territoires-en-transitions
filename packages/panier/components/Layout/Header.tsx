'use client';

import { ENV } from '@/api/environmentVariables';
import { useCollectiviteInfo } from '@/panier/components/Landing/useCollectiviteInfo';
import useLandingPathname from '@/panier/hooks/useLandingPathname';
import { usePanierContext } from '@/panier/providers';
import { Button, HeaderTeT, SITE_BASE_URL } from '@/ui';
import classNames from 'classnames';

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
              className={classNames({
                'hover:!bg-white hover:!border-white hover:!text-primary !cursor-default':
                  !collectiviteInfo.isOwnCollectivite,
              })}
              href={
                collectiviteInfo.isOwnCollectivite
                  ? `${ENV.app_url}/collectivite/${collectiviteInfo.collectivite_id}/accueil`
                  : ''
              }
            >
              {collectiviteInfo.nom}
            </Button>
          );
        }
        return buttons;
      }}
    />
  );
};

export default Header;
