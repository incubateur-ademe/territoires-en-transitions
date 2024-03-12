'use client';

import {Button, HeaderTeT} from '@tet/ui';
import useLandingPathname from 'hooks/useLandingPathname';
import {SITE_BASE_URL} from 'src/utils/constants';

const Header = () => {
  const landingPathname = useLandingPathname();

  return (
    <HeaderTeT
      customRootUrl={landingPathname}
      quickAccessButtons={props => [
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
