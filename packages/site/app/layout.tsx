import { GoogleTagManager } from '@next/third-parties/google';
import AppHeader from '@tet/site/components/layout/AppHeader';
import Footer from '@tet/site/components/layout/Footer';
import { PHProvider } from '@tet/site/providers/posthog';
import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './global.css';
import TrackPage from './TrackPage';
import { getMetaData } from './utils';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const data = await getMetaData();

  return {
    title: {
      default: data?.metaTitle ?? 'Territoires en Transitions',
      template: `%s | ${data?.metaTitle ?? 'Territoires en Transitions'}`,
    },
    description: data?.metaDescription,
    icons: {
      icon: '/favicon.ico',
      other: [
        {
          rel: 'icon',
          url: '/favicon-32x32.png',
          type: 'image/png',
          sizes: '32x32',
        },
        {
          rel: 'icon',
          url: '/favicon-16x16.png',
          type: 'image/png',
          sizes: '16x16',
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    twitter: {
      card: 'summary_large_image',
    },
    openGraph: {
      title: data?.metaTitle ?? 'Territoires en Transitions',
      description: data?.metaDescription,
      url: 'https://www.territoiresentransitions.fr',
      siteName: data?.metaTitle ?? 'Territoires en Transitions',
      images: data?.metaImage
        ? [
            {
              url: data.metaImage.url,
              width: data.metaImage.width,
              height: data.metaImage.height,
              type: data.metaImage.type,
              alt: data.metaImage.alt,
            },
          ]
        : [],
      locale: 'fr_FR',
      type: 'website',
    },
  };
}

export default function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <PHProvider>
      <html>
        <body className="min-h-screen flex flex-col justify-between">
          <div className="grow flex flex-col">
            <AppHeader />
            <div className="grow flex flex-col">{children}</div>
          </div>
          <Footer />
          <TrackPage />

          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src="https://px.ads.linkedin.com/collect/?pid=1701996&fmt=gif"
            />
          </noscript>

          <noscript>
            <p style={{ margin: '0', padding: '0', border: '0' }}>
              <img
                src="https://server.adform.net/Serving/TrackPoint/?pm=2867378&ADFPageName=2024-09-territoiresentransitions.fr-PageArrivee-LP&ADFdivider=|"
                width="1"
                height="1"
                alt=""
              />
            </p>
          </noscript>
        </body>

        <GoogleTagManager gtmId="DC-2967404" />

        <Script id="linkedin" type="text/javascript">
          {`
            _linkedin_partner_id = "1701996";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            </script><script type="text/javascript">
            (function(l) {
            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
            window.lintrk.q=[]}
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "
            https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);})(window.lintrk);
          `}
        </Script>

        <Script id="adform" type="text/javascript">
          {`
            window._adftrack = Array.isArray(window._adftrack) ? window._adftrack : (window._adftrack ? [window._adftrack] : []);
            window._adftrack.push({
              HttpHost: 'server.adform.net',
              pm: 2867378,
              divider: encodeURIComponent('|'),
              pagename: encodeURIComponent('2024-09-territoiresentransitions.fr-PageArrivee-LP')
            });
            (function () { var s = document.createElement('script'); s.type = 'text/javascript'; s.async = true; s.src = 'https://s2.adform.net/banners/scripts/st/trackpoint-async.js'; var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(s, x); })();
          `}
        </Script>

        {/* crisp widget */}
        <Script id="crisp" type="text/javascript">{`
          window.$crisp = [];
          window.CRISP_WEBSITE_ID = '${process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID}';
          (function () {
            d = document;
            s = d.createElement('script');
            s.src = 'https://client.crisp.chat/l.js';
            s.async = 1;
            d.getElementsByTagName('head')[0].appendChild(s);
          })();
        `}</Script>
      </html>
    </PHProvider>
  );
}
