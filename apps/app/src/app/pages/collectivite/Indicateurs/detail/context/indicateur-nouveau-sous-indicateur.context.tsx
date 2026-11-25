'use client';

import {
  createContext,
  type JSX,
  type PropsWithChildren,
  useContext,
} from 'react';

export type IndicateurNouveauSousIndicateurValue = Readonly<{
  id: number | null;
  onCreated: (indicateurId: number) => void;
  onNameEditingEnd: () => void;
}>;

const IndicateurNouveauSousIndicateurContext =
  createContext<IndicateurNouveauSousIndicateurValue | null>(null);

export const IndicateurNouveauSousIndicateurProvider = ({
  value,
  children,
}: PropsWithChildren<{
  value: IndicateurNouveauSousIndicateurValue;
}>): JSX.Element => (
  <IndicateurNouveauSousIndicateurContext.Provider value={value}>
    {children}
  </IndicateurNouveauSousIndicateurContext.Provider>
);

export const useIndicateurNouveauSousIndicateur =
  (): IndicateurNouveauSousIndicateurValue => {
    const context = useContext(IndicateurNouveauSousIndicateurContext);
    if (!context) {
      throw new Error(
        'useIndicateurNouveauSousIndicateur must be used within an IndicateurNouveauSousIndicateurProvider'
      );
    }
    return context;
  };
