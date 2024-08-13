import React from 'react';
import Landing from '@tet/panier/components/Landing';
import { TrackPageView } from '@tet/ui';

export default function Page({params}: {params: {id: string}}) {
  return (
    <>
      <TrackPageView
        pageName="panier/landing/collectivite"
        properties={{collectivite_preset: parseInt(params.id)}}
      />
      <Landing />
    </>
  );
}
