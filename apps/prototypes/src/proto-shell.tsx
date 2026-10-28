import { AppShell, FooterTeT, Header } from '@tet/ui';
import { ReactNode } from 'react';

/**
 * Cadre des prototypes : la coque de page de l'app (`AppShell`), avec le
 * header du design system et une navigation factice. Le contenu d'un
 * prototype s'affiche donc exactement là où l'app l'afficherait.
 */
export const ProtoShell = ({ children }: { children: ReactNode }) => (
  <AppShell
    header={
      <Header
        rootUrl="/"
        mainNav={{
          startItems: [{ children: 'Prototypes', href: '/' }],
        }}
      />
    }
    footer={<FooterTeT />}
  >
    {children}
  </AppShell>
);
