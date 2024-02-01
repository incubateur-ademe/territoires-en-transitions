"use client"

import {actionDetailsSelect, ActionImpactDetails} from '@tet/api';

import useSWR from 'swr';
import {singleFetcher} from 'lib/fetcherClient';



export default function ActionImpactDetails({id}: { id: number }) {
  const {data, error} =
    useSWR<ActionImpactDetails>(
      `rest/v1/action_impact?id=eq.${id}&select=${actionDetailsSelect}`,
      singleFetcher);

  if (!data) {
    return <div>Loading...</div>;
  }

  return <div>
    <h1>{data.titre}</h1>
    <p>{data.description}</p>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>;
}
