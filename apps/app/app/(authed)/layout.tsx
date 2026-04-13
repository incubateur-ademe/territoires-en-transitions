import { ReactNode } from 'react';

import { AppLayout } from '@/app/ui/layout/app-layout';
import { SidePanelProvider } from '@/app/ui/layout/side-panel/side-panel.context';
import { ToggleSuperAdminModeCheckbox } from '@/app/users/authorizations/super-admin-mode/toggle-super-admin-mode.checkbox';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasPermission } from '@tet/domain/users';
import { AuthedProviders } from './authed-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getUser();
  const canToggleSuperAdmin = hasPermission(
    user,
    'users.authorizations.mutate_super_admin_role'
  );

  return (
    <AuthedProviders user={user}>
      <SidePanelProvider>
        <AppLayout
          belowFooterSlot={
            canToggleSuperAdmin ? <ToggleSuperAdminModeCheckbox /> : undefined
          }
        >
          {children}
        </AppLayout>
      </SidePanelProvider>
    </AuthedProviders>
  );
}
