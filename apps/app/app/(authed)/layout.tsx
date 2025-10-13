import { ReactNode } from 'react';

import { getUser } from '@/api/users/user-details.fetch.server';
import { AppLayout } from '@/app/ui/layout/app-layout';
import { SidePanelProvider } from '@/app/ui/layout/side-panel/side-panel.context';
import { AuthedProviders } from './authed-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <AuthedProviders user={user}>
      <SidePanelProvider>
        <AppLayout>{children}</AppLayout>
      </SidePanelProvider>
    </AuthedProviders>
  );
}
