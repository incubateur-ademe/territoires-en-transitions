'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

type DisplaySettingsContextValue = {
  actionsAreAllExpanded: boolean;
  setActionsAreAllExpanded: (value: boolean) => void;
};

const DisplaySettingsContext = createContext<
  DisplaySettingsContextValue | undefined
>(undefined);

export function DisplaySettingsProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [actionsAreAllExpanded, setActionsAreAllExpanded] =
    useState<boolean>(false);

  return (
    <DisplaySettingsContext
      value={{
        actionsAreAllExpanded,
        setActionsAreAllExpanded,
      }}
    >
      {children}
    </DisplaySettingsContext>
  );
}

export function useDisplaySettings(): DisplaySettingsContextValue {
  const context = useContext(DisplaySettingsContext);
  if (context === undefined) {
    throw new Error(
      'useDisplaySettings must be used within a DisplaySettingsProvider'
    );
  }
  return context;
}
