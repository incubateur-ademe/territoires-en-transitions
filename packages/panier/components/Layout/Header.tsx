'use client';

import useLandingPathname from '@tet/panier/hooks/useLandingPathname';
import { Button, HeaderTeT, SITE_BASE_URL } from '@tet/ui';

const Header = () => {
  const landingPathname = useLandingPathname();

  return (
    <HeaderTeT
      customRootUrl={landingPathname}
      quickAccessButtons={(props) => [
        <Button
          {...props}
          key="outil"
          href={`${SITE_BASE_URL}/outil-numerique`}
          iconPosition="left"
          external
        >
          Qui sommes-nous ?
        </Button>,
      ]}
    />
  );
};

export default Header;
