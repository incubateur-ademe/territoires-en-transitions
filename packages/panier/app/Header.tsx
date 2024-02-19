'use client';

import {Button, HeaderTeT} from '@tet/ui';
import {APP_BASE_URL, SITE_BASE_URL} from 'src/utils/constants';

const Header = () => {
  return (
    <HeaderTeT
      quickAccessButtons={props => [
        <Button
          {...props}
          key="outil"
          icon="seedling-line"
          href={`${SITE_BASE_URL}/outil-numerique`}
        >
          Qui sommes-nous ?
        </Button>,
        <Button
          {...props}
          key="signup"
          icon="user-add-line"
          href={`${APP_BASE_URL}/auth/signup`}
        >
          Créer un compte
        </Button>,
        <Button
          {...props}
          key="signin"
          icon="user-line"
          href={`${APP_BASE_URL}/auth/signin`}
        >
          Se connecter
        </Button>,
      ]}
    />
  );
};

export default Header;
