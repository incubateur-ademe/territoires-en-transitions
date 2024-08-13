'use client';

import useSWR from 'swr';
import type {ActionImpactDetails} from '@tet/api';
import {actionImpactAPI} from '@tet/panier/src/clientAPI';


export default function ActionImpactDetails({id}: { id: number }) {
  const {data, error} =
    useSWR<ActionImpactDetails | null>(
      ['ActionImpactDetails', id],
      () => actionImpactAPI.fetchActionImpactDetails(id));

  if (!data) {
    return <div>Loading...</div>;
  }

  return <div>
    <h1>{data.titre}</h1>
    <p>{data.description}</p>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>;
}
