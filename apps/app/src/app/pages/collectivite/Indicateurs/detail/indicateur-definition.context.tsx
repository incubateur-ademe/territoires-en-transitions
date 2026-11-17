'use client';

import type { DefinitionFieldsInput } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { createContext, type PropsWithChildren, useContext } from 'react';

export type IndicateurDefinitionValue = {
  indicateur: IndicateurDetaille;
  updateIndicateur: (fields: DefinitionFieldsInput) => void;
  canMutateIndicateur: boolean;
  canMutateValeur: boolean;
};

const IndicateurDefinitionContext =
  createContext<IndicateurDefinitionValue | null>(null);

export const IndicateurDefinitionProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurDefinitionValue }>) => (
  <IndicateurDefinitionContext.Provider value={value}>
    {children}
  </IndicateurDefinitionContext.Provider>
);

export const useIndicateurDefinition = (): IndicateurDefinitionValue => {
  const context = useContext(IndicateurDefinitionContext);
  if (!context) {
    throw new Error(
      'useIndicateurDefinition must be used within an IndicateurDefinitionProvider'
    );
  }
  return context;
};
