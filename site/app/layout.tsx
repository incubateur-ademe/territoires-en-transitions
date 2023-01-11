import { DsfrHead } from '@codegouvfr/react-dsfr/next-appdir/DsfrHead';
import { DsfrProvider } from '@codegouvfr/react-dsfr/next-appdir/DsfrProvider';
import { getColorSchemeHtmlAttributes } from '@codegouvfr/react-dsfr/next-appdir/getColorSchemeHtmlAttributes';
import StartDsfr from './StartDsfr';
import { defaultColorScheme } from './defaultColorScheme';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';

export default function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <html {...getColorSchemeHtmlAttributes({ defaultColorScheme })}>
      <head>
        <StartDsfr />
        <DsfrHead defaultColorScheme={defaultColorScheme} />
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
        <DsfrProvider defaultColorScheme={defaultColorScheme}>
          <AppHeader />
          {children}
          <AppFooter />
        </DsfrProvider>
      </body>
    </html>
  );
}
