'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';

export type IndicateurDeletionValue = {
  deleteIndicateur: () => void;
};

const IndicateurDeletionContext = createContext<IndicateurDeletionValue | null>(
  null
);

export const IndicateurDeletionProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurDeletionValue }>) => (
  <IndicateurDeletionContext.Provider value={value}>
    {children}
  </IndicateurDeletionContext.Provider>
);

export const useIndicateurDeletion = (): IndicateurDeletionValue => {
  const context = useContext(IndicateurDeletionContext);
  if (!context) {
    throw new Error(
      'useIndicateurDeletion must be used within an IndicateurDeletionProvider'
    );
  }
  return context;
};
