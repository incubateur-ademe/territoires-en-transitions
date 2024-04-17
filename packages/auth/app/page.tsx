'use client';

import React, {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import TrackPageView from '@components/TrackPageView/index';

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <TrackPageView pageName="panier/" />;
};

export default Page;
