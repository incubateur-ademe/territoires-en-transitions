'use client';

import AccepterCGUModal from '@/app/app/pages/Auth/AccepterCGUModal';
import { SupportModeProvider } from '@/app/users/authorizations/support-mode/support-mode.provider';
import { NPSTracker } from '@/app/utils/nps/nps-tracker';
import { Toasters } from '@/app/utils/toast/toasters';
import { CollectiviteProvider } from '@tet/api/collectivites';
import { UserProviderStoreClient } from '@tet/api/users';
import { UserWithCollectiviteAccesses } from '@tet/domain/users';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const Stonly = dynamic(() => import('../../src/lib/stonly.widget'), {
  ssr: false,
});

export function AuthedProviders({
  user,
  children,
}: {
  user: UserWithCollectiviteAccesses;
  children: ReactNode;
}) {
  return (
    <UserProviderStoreClient user={user}>
      <CollectiviteProvider user={user}>
        <SupportModeProvider>
          <Toasters />
          <NPSTracker />
          <AccepterCGUModal />
          {children}
        </SupportModeProvider>
      </CollectiviteProvider>
      <Stonly />
    </UserProviderStoreClient>
  );
}
