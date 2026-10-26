import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ProtoShell } from '../src/proto-shell';
import './global.css';

export const metadata: Metadata = {
  title: 'Prototypes — Territoires en Transitions',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" translate="no">
      <body>
        <ProtoShell>{children}</ProtoShell>
      </body>
    </html>
  );
}
