import React from 'react';
import TrackPageView from '@components/TrackPageView';
import Landing from '@components/Landing';

export default async function Page({params}: {params: {id: string}}) {
  return (
    <>
      <TrackPageView pageName="panier/landing/collectivite" />
      <Landing />
    </>
  );
}
