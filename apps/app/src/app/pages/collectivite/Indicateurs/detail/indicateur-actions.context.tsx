'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';

export type IndicateurActionsValue = {
  exportIndicateur: () => void;
  deleteIndicateur: () => void;
};

const IndicateurActionsContext = createContext<IndicateurActionsValue | null>(
  null
);

export const IndicateurActionsProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurActionsValue }>) => (
  <IndicateurActionsContext.Provider value={value}>
    {children}
  </IndicateurActionsContext.Provider>
);

export const useIndicateurActions = (): IndicateurActionsValue => {
  const context = useContext(IndicateurActionsContext);
  if (!context) {
    throw new Error(
      'useIndicateurActions must be used within an IndicateurActionsProvider'
    );
  }
  return context;
};
