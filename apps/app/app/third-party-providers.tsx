'use client';

import dynamic from 'next/dynamic';

const Crisp = dynamic(() => import('../src/lib/crisp.widget'), {
  ssr: false,
});

const Datadog = dynamic(() => import('../src/lib/datadog.init'), {
  ssr: false,
});

export default function ThirdPartyProviders() {
  return (
    <>
      <Crisp />
      <Datadog />
    </>
  );
}
