'use client';

import {Button, HeaderTeT} from '@tet/ui';
import {SITE_BASE_URL} from 'src/utils/constants';

const Header = () => {
  return (
    <HeaderTeT
      customRootUrl="/landing"
      quickAccessButtons={props => [
        <Button
          {...props}
          key="outil"
          icon="seedling-line"
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
