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
