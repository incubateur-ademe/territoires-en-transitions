'use client';

import {useState} from 'react';
import {SignupModal} from '@tet/ui';
import {signup} from './actions';
import {useCollectivites} from './useCollectivites';

const SignupPage = () => {
  const [filter, setFilter] = useState('');
  const {data: collectivites} = useCollectivites(filter);

  return (
    <SignupModal
      onSubmit={signup}
      collectivites={collectivites || []}
      onFilterCollectivites={setFilter}
    />
  );
};

export default SignupPage;
