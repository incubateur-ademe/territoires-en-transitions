'use client';

import {
  Consent,
  createTrackingClient,
  getConsent,
  getNextConsentEnvId,
  getNextTrackingEnv,
  ScriptLikeProps,
  TrackingProvider,
} from '@tet/ui';
import Script from 'next/script';

const client = createTrackingClient(getNextTrackingEnv());
const onConsentSave = () => {
  client.set_config({persistence: getConsent() ? 'cookie' : 'memory'});
};

export const PHProvider = ({children}: {children: React.ReactNode}) => {
  return (
    <>
      <TrackingProvider client={client}>{children}</TrackingProvider>
      <Consent
        onConsentSave={onConsentSave}
        consentId={getNextConsentEnvId()}
        script={(props: ScriptLikeProps) => <Script {...props} />}
      />
    </>
  );
};
