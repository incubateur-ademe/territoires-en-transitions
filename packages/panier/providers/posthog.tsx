'use client';

import {
  Consent,
  getConsent,
  getNextConsentEnvId,
  ScriptLikeProps,
  TrackingProvider,
} from '@/ui';
import Script from 'next/script';
import { PostHog } from 'posthog-js';
import { ReactNode, useState } from 'react';

export const PHProvider = ({ children }: { children: ReactNode }) => {
  const [posthogClient, setPosthogClient] = useState<PostHog | null>(null);

  return (
    <>
      <TrackingProvider onClientInit={(client) => setPosthogClient(client)}>
        {children}
      </TrackingProvider>

      <Consent
        onConsentSave={() => {
          posthogClient?.set_config({
            persistence: getConsent() ? 'cookie' : 'memory',
          });
        }}
        consentId={getNextConsentEnvId()}
        script={(props: ScriptLikeProps) => <Script {...props} />}
      />
    </>
  );
};
