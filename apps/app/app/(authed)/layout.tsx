import { ReactNode } from 'react';

import { getUser } from '@/api/users/user-details.fetch.server';
import Header from '@/app/app/Layout/Header';
import { FooterTeT } from '@/ui';
import AppProviders from './app-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <AppProviders user={user}>
      <Header />
      {/** min-h-screen ici afin que le footer soit toujours sous le viewport.
       * Idéalement il faudrait enlever la hauteur du header, mais c'est rajouter de la complexité pour pas grand chose. */}
      <div className="min-h-screen flex flex-col bg-grey-2">{children}</div>
      <FooterTeT id="footer" />
    </AppProviders>
  );
}
