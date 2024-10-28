import { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import Script from 'next/script';
import Footer from './Layout/Footer';
import Header from './Layout/Header';
import AppProviders from './app-providers';
import './global.css';

export const dynamic = 'force-dynamic';

const shared = {
  title: 'Territoires en Transitions',
  description: "Prioriser - Mettre en œuvre - Planifier - Suivre l'impact",
};

export const metadata: Metadata = {
  title: shared.title,
  description: shared.description,
  robots: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  icons: {
    icon: [
      {
        sizes: '16x16',
        url: '/favicon-16x16.png',
      },
      {
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
    ],
  },
  openGraph: {
    title: shared.title,
    description: shared.description,
    url: 'https://app.territoiresentransitions.fr/',
    siteName: shared.title,
    locale: 'fr_FR',
    images: [
      {
        url: '/territoires_en_transitions.png',
        width: 491,
        height: 439,
        alt: shared.title,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: shared.title,
    description: shared.description,
    images: {
      url: 'https://app.territoiresentransitions.fr/territoires_en_transitions.png', // Must be an absolute URL
      width: 491,
      height: 439,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const CrispWithNoSSR = nextDynamic(() => import('../lib/crisp.widget'));

  return (
    <html lang="fr" translate="no" data-fr-scheme="light">
      <body>
        <div id="root">
          <div className="flex flex-col h-[100vh] overflow-hidden">
            <div
              id="main"
              className="flex-grow flex flex-col w-full overflow-x-hidden overflow-y-auto"
            >
              <AppProviders>
                <Header />
                {children}
                <Footer />
              </AppProviders>
            </div>
          </div>
        </div>
      </body>
      <CrispWithNoSSR />
      <Script id="stonly-widget">
        {`window.STONLY_WID = "1b1b2533-383c-11ef-a9d4-06cb0cb2a85e";!function(s,t,o,n,l,y,w,g,d,e){s.StonlyWidget||((d=s.StonlyWidget=function(){
  d._api?d._api.apply(d,arguments):d.queue.push(arguments)}).scriptPath=n,d.apiPath=l,d.sPath=y,d.queue=[],
  (g=t.createElement(o)).async=!0,(e=new XMLHttpRequest).open("GET",n+"version?v="+Date.now(),!0),
  e.onreadystatechange=function(){4===e.readyState&&(g.src=n+"stonly-widget.js?v="+
  (200===e.status?e.responseText:Date.now()),(w=t.getElementsByTagName(o)[0]).parentNode.insertBefore(g,w))},e.send())
  }(window,document,"script","https://stonly.com/js/widget/v2/");`}
      </Script>
    </html>
  );
}
