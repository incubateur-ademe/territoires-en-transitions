import Landing from '@tet/panier/components/Landing';
import { TrackPageView } from '@tet/ui';
import React from 'react';

const Page = () => {
  return (
    <>
      <TrackPageView pageName="panier/landing" />
      <Landing />
    </>
  );
};

export default Page;
