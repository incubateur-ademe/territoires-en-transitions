'use client';

import type { RouterInput } from '@tet/api';
import type { IndicateurPeriode } from '@tet/domain/indicateurs';
import { createContext, type PropsWithChildren, useContext } from 'react';

type SaveIndicateurValeurInput = Omit<
  RouterInput['indicateurs']['valeurs']['upsert'],
  'collectiviteId' | 'indicateurId'
>;

export type IndicateurValeursValue = {
  saveValeur: (input: SaveIndicateurValeurInput) => Promise<void>;
  declarePeriode: (periode: IndicateurPeriode) => Promise<void>;
  declarePeriodes: (periodes: IndicateurPeriode[]) => Promise<void>;
  deleteValeur: (valeurId: number) => Promise<void>;
};

const IndicateurValeursContext = createContext<IndicateurValeursValue | null>(
  null
);

export const IndicateurValeursProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurValeursValue }>) => (
  <IndicateurValeursContext.Provider value={value}>
    {children}
  </IndicateurValeursContext.Provider>
);

export const useIndicateurValeurs = (): IndicateurValeursValue => {
  const context = useContext(IndicateurValeursContext);
  if (!context) {
    throw new Error(
      'useIndicateurValeurs must be used within an IndicateurValeursProvider'
    );
  }
  return context;
};
