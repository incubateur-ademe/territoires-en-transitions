import Landing from '@tet/panier/components/Landing';
import { TrackPageView } from '@tet/ui';
import React from 'react';

export default function Page() {
  return (
    <>
      <TrackPageView pageName="panier/landing" />
      <Landing />
    </>
  );
}
