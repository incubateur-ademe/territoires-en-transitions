/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Consent,
  getConsent,
  getNextConsentEnvId,
  PostHogProvider,
  ScriptLikeProps,
} from '@/ui';
import Script from 'next/script';
import posthog from 'posthog-js';

declare global {
  interface Window {
    $crisp: any;
    CRISP_WEBSITE_ID: string | undefined;
    _adftrack: any;
    dataLayer: any;
    lintrk: any;
    _linkedin_partner_id: any;
    _linkedin_data_partner_ids: any;
  }
}

const onConsentSave = () => {
  posthog.set_config({
    persistence: getConsent() ? 'localStorage+cookie' : 'memory',
  });
};

export const Trackers = ({
  config,
  nonce,
  children,
}: {
  config: { host?: string; key?: string };
  nonce: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <PostHogProvider
        config={{
          host: config.host,
          key: config.key,
        }}
      >
        {children}
      </PostHogProvider>

      <Consent
        onConsentSave={onConsentSave}
        onCookiesComplete={(choices) => loadScripts(choices, nonce)}
        consentId={getNextConsentEnvId()}
        script={(props: ScriptLikeProps) => <Script {...props} />}
      />
    </>
  );
};

function loadScripts(
  choices: Record<string, boolean | undefined>,
  nonce: string
) {
  if (choices.crisp) {
    loadCrispWidget();
  }

  if (choices.adform) {
    loadAdform();
  }

  if (choices.google) {
    loadGoogleTagManager(nonce);
  }

  if (choices.linkedin) {
    loadLinkedIn();
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

function loadGoogleTagManager(nonce: string) {
  if (typeof window !== 'undefined') {
    // Load GTM script first
    const script = document.createElement('script');
    script.nonce = nonce;
    script.appendChild(
      document.createTextNode(`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;var n=d.querySelector('[nonce]');
n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));f.parentNode.insertBefore(j,f);
w[l].push({'event':'conversion','allow_custom_scripts':true,'send_to':'DC-2967404/teng/2024-0+standard'});
})(window,document,'script','dataLayer','DC-2967404');
    `)
    );

    // Ensure GTM is ready
    // script.onload = () => {
    //   window.dataLayer = window.dataLayer || [];

    //   const gtag = (...args: any[]) => {
    //     window.dataLayer?.push(args);
    //   };

    //   // gtag('js', new Date());
    //   // gtag('config', 'DC-2967404');
    //   gtag('event', 'conversion', {
    //     allow_custom_scripts: true,
    //     send_to: 'DC-2967404/teng/2024-0+standard',
    //   });
    // };

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
    window._linkedin_partner_id = '7177946';
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
