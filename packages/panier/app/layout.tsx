import './global.css';
import CollectiviteProvider from 'providers/collectivite';
import PHProvider from 'providers/posthog';
import Footer from '@components/Layout/Footer';
import Header from '@components/Layout/Header';
import PanierProvider from 'providers/panier';
import Axeptio from '@components/Axeptio';

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

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="fr">
      <PHProvider>
        <body className="min-h-screen overflow-x-visible flex flex-col">
          <CollectiviteProvider>
            <PanierProvider>
              <div className="flex flex-col grow">
                <Header />
                <div className="bg-grey-2 grow flex flex-col">
                  <div className="grow">{children}</div>
                </div>
              </div>
            </PanierProvider>
          </CollectiviteProvider>
          <Footer />
        </body>
      </PHProvider>
      <Axeptio />
    </html>
  );
}
