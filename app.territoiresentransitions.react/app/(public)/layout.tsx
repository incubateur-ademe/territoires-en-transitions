import { getAuthUser } from '@/api/utils/supabase/auth-user.server';
import Footer from '@/app/app/Layout/Footer';
import { Header } from '@/app/app/Layout/Header/Header';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (user) {
    // TODO-NEXTJS
    // For now redirect to `/collectivite` to trigger redirects from the client component `Redirector`
    // This should be replaced by a server component logic.
    redirect('/collectivite');
  }

  return (
    <>
      <Header
        auth={{
          user: null,
          isConnected: false,
        }}
        ownedCollectivites={[]}
        currentCollectivite={null}
        panierId={undefined}
        maintenance={null}
      />
      {children}
      <Footer />
    </>
  );
}
