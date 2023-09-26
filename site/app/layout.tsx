import AppHeader from './AppHeader';
import '@gouvfr/dsfr/dist/dsfr.css';
import './global.css';
import {Footer} from '@components/footer/Footer';
import {Metadata} from 'next';
import {getMetaData} from './utils';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getMetaData();

  return {
    title: {
      default: data.title ?? 'Territoires en Transitions',
      template: `%s | ${data.title ?? 'Territoires en Transitions'}`,
    },
    description: data.description,
  };
}

export default function RootLayout({children}: {children: JSX.Element}) {
  return (
    <html>
      <head>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
      </head>
      <body className="min-h-screen flex flex-col justify-between">
        <div>
          <AppHeader />
          <div className="homepage-container fr-container-fluid">
            {children}
          </div>
        </div>
        <Footer />
      </body>
    </html>
  );
}
