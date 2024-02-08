// modale floating-ui ne pouvant s'afficher que côté client...
'use client';

import {login} from './actions';
import {LoginModal} from '@tet/ui';

const LoginPage = () => {
  return <LoginModal defaultView="par_lien" onSubmit={login} />;
};

export default LoginPage;
