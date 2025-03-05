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

export const PHProvider = ({
  config,
  children,
}: {
  config: { host?: string; key?: string };
  children: ReactNode;
}) => {
  const [posthogClient, setPosthogClient] = useState<PostHog | null>(null);

  return (
    <>
      <TrackingProvider
        config={config}
        onClientInit={(client) => setPosthogClient(client)}
      >
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
