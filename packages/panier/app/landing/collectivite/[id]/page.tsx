import Landing from '@components/Landing';
import React from 'react';
import TrackPageView from '@components/TrackPageView';

export default async function Page({params}: {params: {id: string}}) {
  return (
    <>
      <TrackPageView pageName="landing/collectivite" />
      <Landing />
    </>
  );
}
