import { ReactNode } from 'react';

import { getUser } from '@/api/users/user-details.fetch.server';
import { AppLayout } from '@/app/ui/layout/app-layout';
import { SidePanelProvider } from '@/app/ui/layout/side-panel/side-panel.context';
import AppProviders from './app-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <AppProviders user={user}>
      <SidePanelProvider>
        <AppLayout>{children}</AppLayout>
      </SidePanelProvider>
    </AppProviders>
  );
}
