'use client';

import {
  Consent,
  getConsent,
  getNextConsentEnvId,
  PostHogProvider,
  ScriptLikeProps,
} from '@tet/ui';
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
      <PostHogProvider
        config={{ ...config, shouldIdentifyUser: false }}
        onClientInit={(client) => setPosthogClient(client)}
      >
        {children}
      </PostHogProvider>

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
