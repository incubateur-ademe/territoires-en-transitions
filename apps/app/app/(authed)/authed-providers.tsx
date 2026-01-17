'use client';

import AccepterCGUModal from '@/app/app/pages/Auth/AccepterCGUModal';
import { SuperAdminModeProvider } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { NPSTracker } from '@/app/utils/nps/nps-tracker';
import { CollectiviteProvider } from '@tet/api/collectivites';
import { UserProviderStoreClient } from '@tet/api/users';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const Stonly = dynamic(() => import('../../src/lib/stonly.widget'), {
  ssr: false,
});

export function AuthedProviders({
  user,
  children,
}: {
  user: UserWithRolesAndPermissions;
  children: ReactNode;
}) {
  return (
    <UserProviderStoreClient user={user}>
      <CollectiviteProvider user={user}>
        <SuperAdminModeProvider>
          <NPSTracker />
          <AccepterCGUModal />
          {children}
        </SuperAdminModeProvider>
      </CollectiviteProvider>
      <Stonly />
    </UserProviderStoreClient>
  );
}
