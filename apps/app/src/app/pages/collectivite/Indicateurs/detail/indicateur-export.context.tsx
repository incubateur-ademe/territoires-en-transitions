'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';

export type IndicateurExportValue = {
  exportIndicateur: () => void;
};

const IndicateurExportContext = createContext<IndicateurExportValue | null>(
  null
);

export const IndicateurExportProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurExportValue }>) => (
  <IndicateurExportContext.Provider value={value}>
    {children}
  </IndicateurExportContext.Provider>
);

export const useIndicateurExport = (): IndicateurExportValue => {
  const context = useContext(IndicateurExportContext);
  if (!context) {
    throw new Error(
      'useIndicateurExport must be used within an IndicateurExportProvider'
    );
  }
  return context;
};
