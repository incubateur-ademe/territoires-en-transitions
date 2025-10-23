'use client';

import { ENV } from '@/api/environmentVariables';
import dynamic from 'next/dynamic';

const CrispWidget = dynamic(
  () => import('./crisp.widget').then((mod) => mod.CrispWidget),
  {
    ssr: false,
  }
);

export function CrispWidgetLazyLoad() {
  if (!ENV.crisp_website_id || ENV.crisp_website_id.length === 0) {
    return null;
  }

  return <CrispWidget websiteId={ENV.crisp_website_id} />;
}
