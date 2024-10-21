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
  client.set_config({ persistence: getConsent() ? 'cookie' : 'memory' });
};

export const Trackers = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <TrackingProvider client={client}>{children}</TrackingProvider>

      <Consent
        onConsentSave={onConsentSave}
        onCookiesComplete={loadScripts}
        consentId={getNextConsentEnvId()}
        script={(props: ScriptLikeProps) => <Script {...props} />}
      />
    </>
  );
};

function loadScripts(choices: Record<string, boolean | undefined>) {
  if (choices.crisp) {
    loadCrispWidget();
  }

  if (choices.adform) {
    loadAdform();
  }

  if (choices.google) {
    loadGoogleTagManager();
  }

  if (choices.linkedin) {
    loadLinkedIn();
  }

  if (choices.azerion) {
    loadAzerion();
  }
}

function loadCrispWidget() {
  if (typeof window !== 'undefined') {
    window.$crisp = [];
    window.$crisp.push(['set', 'session:segments', [['site public']]]);
    window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

    const d = document;
    const s = d.createElement('script');

    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;

    d.getElementsByTagName('head')[0].appendChild(s);
  }
}

function loadGoogleTagManager() {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (...args: any[]) => {
      window.dataLayer?.push(args);
    };

    gtag('js', new Date());
    gtag('config', 'DC-2967404');

    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=DC-2967404';
    script.async = true;

    document.head.appendChild(script);
  }
}

function loadAdform() {
  if (typeof window !== 'undefined') {
    window._adftrack = Array.isArray(window._adftrack)
      ? window._adftrack
      : window._adftrack
      ? [window._adftrack]
      : [];
    window._adftrack.push({
      HttpHost: 'server.adform.net',
      pm: 2867378,
      divider: encodeURIComponent('|'),
      pagename: encodeURIComponent(
        '2024-09-territoiresentransitions.fr-PageArrivee-LP'
      ),
    });
    (function () {
      const s = document.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.src = 'https://s2.adform.net/banners/scripts/st/trackpoint-async.js';
      const x = document.getElementsByTagName('script')[0];
      x.parentNode?.insertBefore(s, x);
    })();
  }
}

function loadLinkedIn() {
  if (typeof window !== 'undefined') {
    window._linkedin_partner_id = '1701996';
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(window._linkedin_partner_id);

    (function (l) {
      if (!l) {
        // @ts-expect-error type unknown
        window.lintrk = function (a, b) {
          window.lintrk.q.push([a, b]);
        };
        window.lintrk.q = [];
      }
      const s = document.getElementsByTagName('script')[0];
      const b = document.createElement('script');
      b.type = 'text/javascript';
      b.async = true;
      b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
      s.parentNode?.insertBefore(b, s);
    })(window.lintrk);
  }
}

function loadAzerion() {
  if (typeof window !== 'undefined') {
    const img = new Image();
    img.src = 'https://secure.adnxs.com/px?id=1827352&t=2';
    img.width = 1;
    img.height = 1;
  }
}
