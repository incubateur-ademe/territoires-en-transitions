import { AppShell, FooterTeT, Header } from '@tet/ui';
import { ReactNode } from 'react';

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
