'use client';

import type { DefinitionFieldsInput } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import type { RouterInput } from '@tet/api';
import type { IndicateurPeriode } from '@tet/domain/indicateurs';
import { createContext, type PropsWithChildren, useContext } from 'react';

type SaveIndicateurValeurInput = Omit<
  RouterInput['indicateurs']['valeurs']['upsert'],
  'collectiviteId' | 'indicateurId'
>;

export type IndicateurActionsValue = {
  updateIndicateur: (fields: DefinitionFieldsInput) => void;
  exportIndicateur: () => void;
  deleteIndicateur: () => void;
  saveValeur: (input: SaveIndicateurValeurInput) => Promise<void>;
  declarePeriode: (periode: IndicateurPeriode) => Promise<void>;
  declarePeriodes: (periodes: IndicateurPeriode[]) => Promise<void>;
  deleteValeur: (valeurId: number) => Promise<void>;
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
