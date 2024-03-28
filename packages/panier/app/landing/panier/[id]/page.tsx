import Landing from '@components/Landing';
import TrackPageView from '@components/TrackPageView/index';
import React from 'react';

const Page = () => {
  return (
    <>
      <TrackPageView pageName="landing" />
      <Landing />
    </>
  );
};

export default Page;
