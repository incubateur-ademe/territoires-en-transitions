'use client';

import { CollectiviteProvider } from '@/api/collectivites';
import { UserProviderStoreClient } from '@/api/users/user-context/user-context-store.client';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import AccepterCGUModal from '@/app/app/pages/Auth/AccepterCGUModal';
import { DemoModeProvider } from '@/app/users/demo-mode-support-provider';
import { NPSTracker } from '@/app/utils/nps/nps-tracker';
import { Toasters } from '@/app/utils/toast/toasters';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const Stonly = dynamic(() => import('../../src/lib/stonly.widget'), {
  ssr: false,
});

export function AuthedProviders({
  user,
  children,
}: {
  user: UserDetails;
  children: ReactNode;
}) {
  return (
    <UserProviderStoreClient user={user}>
      <CollectiviteProvider user={user}>
        <DemoModeProvider>
          <Toasters />
          <NPSTracker />
          <AccepterCGUModal />
          {children}
        </DemoModeProvider>
      </CollectiviteProvider>
      <Stonly />
    </UserProviderStoreClient>
  );
}
