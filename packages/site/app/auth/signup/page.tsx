'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {SignupModal} from '@tet/ui';
import {signup} from './actions';
import {useCollectivites} from './useCollectivites';

const SignupPage = () => {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const {data: collectivites} = useCollectivites(filter);

  return (
    <SignupModal
      collectivites={collectivites || []}
      onFilterCollectivites={setFilter}
      onCancel={() => router.back()}
      onSubmit={signup}
    />
  );
};

export default SignupPage;
