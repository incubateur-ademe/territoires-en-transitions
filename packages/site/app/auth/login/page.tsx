// modale floating-ui ne pouvant s'afficher que côté client...
'use client';

import {useRouter} from 'next/navigation';
import {LoginModal} from '@tet/ui';
import {login} from './actions';

const LoginPage = () => {
  const router = useRouter();
  return (
    <LoginModal
      defaultView="par_lien"
      onCancel={() => router.back()}
      onSubmit={login}
    />
  );
};

export default LoginPage;
