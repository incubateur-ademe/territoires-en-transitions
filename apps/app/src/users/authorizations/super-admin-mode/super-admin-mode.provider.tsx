import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useUser } from '@tet/api/users';
import { hasPermission, hasRole, PlatformRole } from '@tet/domain/users';
import { noop } from 'es-toolkit';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext } from 'react';
import { SuperAdminModeEnabledAlert } from './super-admin-mode-enabled.alert';
import { ToggleSuperAdminModeCheckbox } from './toggle-super-admin-mode.checkbox';

interface SuperAdminModeContextProps {
  isSuperAdminRoleEnabled: boolean;
  toggleSuperAdminRole: () => void;
  isPending: boolean;
}

const SuperAdminModeContext = createContext<
  SuperAdminModeContextProps | undefined
>(undefined);

export const useSuperAdminMode = () => {
  const context = useContext(SuperAdminModeContext);

  if (!context) {
    return {
      isSuperAdminRoleEnabled: false,
      toggleSuperAdminRole: noop,
      isPending: false,
    };
  }
  return context;
};

export function SuperAdminModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const trpc = useTRPC();
  const router = useRouter();

  const isSuperAdminRoleEnabled = hasRole(user, PlatformRole.SUPER_ADMIN);

  const { mutate: toggleSuperAdminRole, isPending } = useMutation(
    trpc.users.authorizations.toggleSuperAdminRole.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    })
  );

  const handleToggle = () => {
    toggleSuperAdminRole({ isEnabled: !isSuperAdminRoleEnabled });
  };

  return (
    <SuperAdminModeContext.Provider
      value={{
        isSuperAdminRoleEnabled,
        toggleSuperAdminRole: handleToggle,
        isPending,
      }}
    >
      {isSuperAdminRoleEnabled && (
        <div className="sticky top-0 z-tooltip">
          <SuperAdminModeEnabledAlert />
        </div>
      )}

      {children}

      {hasPermission(user, 'users.authorizations.mutate_super_admin_role') && (
        <div className="w-full max-w-8xl mx-auto px-4 pb-4">
          <ToggleSuperAdminModeCheckbox />
        </div>
      )}
    </SuperAdminModeContext.Provider>
  );
}
