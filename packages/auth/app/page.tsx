'use client';

import React, {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import TrackPageView from '@components/TrackPageView';

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <TrackPageView pageName="auth/" />;
};

export default Page;
