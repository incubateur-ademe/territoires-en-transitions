'use client';

import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {SignupModal} from '@tet/ui';
import {useCollectivites} from './useCollectivites';
import {useSignupState} from './useSignupState';
import {DEFAULT_REDIRECT} from '../constants';

const SignupPage = () => {
  const [filter, setFilter] = useState('');
  const {data: collectivites} = useCollectivites(filter);

  const searchParams = useSearchParams();
  const defaultView = searchParams.get('view');
  const defaultValues = {
    email: searchParams.get('email'),
    otp: searchParams.get('otp'),
  };
  const redirectTo = searchParams.get('redirect_to') || DEFAULT_REDIRECT;
  const state = useSignupState({redirectTo, defaultView, defaultValues});

  return (
    <SignupModal
      collectivites={collectivites || []}
      onFilterCollectivites={setFilter}
      defaultValues={defaultValues}
      {...state}
    />
  );
};

export default SignupPage;
