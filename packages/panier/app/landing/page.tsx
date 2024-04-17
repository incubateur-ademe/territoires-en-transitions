import Landing from '@components/Landing';
import TrackPageView from '@components/TrackPageView/index';
import React from 'react';

export default async function Page() {
  return (
    <>
      <TrackPageView pageName="panier/landing" />
      <Landing />
    </>
  );
}
