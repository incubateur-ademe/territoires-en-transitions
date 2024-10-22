import { Metadata } from 'next';
import Header from './Layout/Header';
import Footer from './Layout/Footer';
import AppProviders from './app-providers';

import './global.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Territoires en Transitions',
  description: "Prioriser - Mettre en œuvre - Planifier - Suivre l'impact",
  robots:
    'index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    </html>
  );
}
