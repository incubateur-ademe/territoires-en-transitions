import TrackPageView from '@components/TrackPageView/index';
import React from 'react';
import Landing from './Landing';

export default async function Page() {
  return (
    <>
      <TrackPageView pageName="landing" />
      <Landing />
    </>
  );
}
