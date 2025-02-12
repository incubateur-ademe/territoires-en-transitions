import { getCookieOptions } from '@/api/utils/supabase/cookie-options';
import { SupabaseProvider } from '@/api/utils/supabase/use-supabase';
import Footer from '@/panier/components/Layout/Footer';
import Header from '@/panier/components/Layout/Header';
import { headers } from 'next/headers';
import Script from 'next/script';
import { StoreProvider } from '../providers';
import './global.css';

export const metadata = {
  title: 'Territoires en Transitions',
  description:
    'Initiez des actions impactantes et valorisez le chemin déjà parcouru',
  lang: 'fr',
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
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hostname = (await headers()).get('host');
  const supabaseCookieOptions = getCookieOptions(hostname ?? undefined);

  return (
    <html lang="fr">
      <SupabaseProvider cookieOptions={supabaseCookieOptions}>
        <StoreProvider>
          <body className="min-h-screen overflow-x-visible flex flex-col">
            <div className="flex flex-col grow">
              <Header />
              <div className="bg-grey-2 grow flex flex-col">
                <div className="grow">{children}</div>
              </div>
            </div>
            <Footer />
          </body>
        </StoreProvider>
      </SupabaseProvider>
      {/* crisp widget */}
      <Script id="crisp" type="text/javascript">{`
          window.$crisp = [];
          $crisp.push(["set", "session:segments", [["PAI"]]])
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
  );
}
