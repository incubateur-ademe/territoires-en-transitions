import './global.css';
import {PHProvider} from './providers';

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

export default function RootLayout({children}: { children: React.ReactNode }) {
  return (
    <html lang="fr">
    <PHProvider>
      <body className="min-h-screen flex flex-col">
        <div className="flex flex-col grow">
          <header className="px-4 lg:px-6 xl:px-2 py-8 text-center">
            HEADER
          </header>
          <div className="bg-grey-2 grow flex flex-col">
            <div className="grow flex flex-col w-full mx-auto px-4 lg:px-6 xl:max-w-7xl xl:px-2">
              {children}
            </div>
          </div>
        </div>
        <footer className="px-4 lg:px-6 xl:px-2 py-8 text-center">
          FOOTER
        </footer>
      </body>
    </PHProvider>
    </html>
  );
}
