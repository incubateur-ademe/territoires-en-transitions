import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useUser } from '@tet/api/users';
import { noop } from 'es-toolkit';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext } from 'react';
import { SupportModeEnabledAlert } from './support-mode-enabled.alert';
import { ToggleSupportModeCheckbox } from './toggle-support-mode.checkbox';

interface SupportModeContextProps {
  isSupportModeEnabled: boolean;
  toggleSupportMode: () => void;
  isPending: boolean;
}

const SupportModeContext = createContext<SupportModeContextProps | undefined>(
  undefined
);

export const useSupportMode = () => {
  const context = useContext(SupportModeContext);

  if (!context) {
    return {
      isSupportModeEnabled: false,
      toggleSupportMode: noop,
      isPending: false,
    };
  }
  return context;
};

export function SupportModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const trpc = useTRPC();
  const router = useRouter();

  const isSupportModeEnabled = user.isSupportModeEnabled ?? false;

  const { mutate: toggleSupportMode, isPending } = useMutation(
    trpc.users.authorizations.toggleSupportMode.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    })
  );

  const handleToggle = () => {
    toggleSupportMode({ isEnabled: !isSupportModeEnabled });
  };

  return (
    <SupportModeContext.Provider
      value={{
        isSupportModeEnabled,
        isPending,
        toggleSupportMode: handleToggle,
      }}
    >
      {isSupportModeEnabled && (
        <div className="sticky top-0 z-tooltip">
          <SupportModeEnabledAlert />
        </div>
      )}

      {children}

      {user.isSupport && (
        <div className="w-full max-w-8xl mx-auto px-4 pb-4">
          <ToggleSupportModeCheckbox />
        </div>
      )}
    </SupportModeContext.Provider>
  );
}
