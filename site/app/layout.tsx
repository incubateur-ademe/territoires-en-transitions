import AppHeader from './AppHeader';
import '@gouvfr/dsfr/dist/dsfr.css';
import './global.css';
import {Footer} from '@components/footer/Footer';

export default function RootLayout({children}: {children: JSX.Element}) {
  return (
    <html>
      <head>
        <title>Territoires en Transitions</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta
          name="description"
          content="Territoires en transitions accompagne les collectivités afin de les aider à piloter plus facilement leur transition écologique."
        />
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
      <body>
        <AppHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}
