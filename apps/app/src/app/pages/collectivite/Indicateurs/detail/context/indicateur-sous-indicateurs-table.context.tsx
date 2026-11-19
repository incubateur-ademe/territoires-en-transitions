'use client';

import type { DetachSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-detach-sous-indicateur';
import type { SousIndicateursCommentaires } from '@/app/indicateurs/sous-indicateurs/data/use-sous-indicateurs-commentaires';
import type { DeleteSousIndicateursPeriode } from '@/app/indicateurs/sous-indicateurs/data/use-delete-sous-indicateurs-periode';
import type { SaveSousIndicateurValeur } from '@/app/indicateurs/sous-indicateurs/data/use-save-sous-indicateur-valeur';
import type { DeclareIndicateursPeriodes } from '@/app/indicateurs/valeurs/use-declare-indicateur-periodes';
import type { SousIndicateursTableState } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table-state.rules';
import {
  createContext,
  type JSX,
  type PropsWithChildren,
  useContext,
} from 'react';

export type IndicateurSousIndicateursTableValue = {
  useSousIndicateursTable: (indicateurId: number) => SousIndicateursTableState;
  useSaveSousIndicateurValeur: () => SaveSousIndicateurValeur;
  useDeclareSousIndicateursPeriodes: () => DeclareIndicateursPeriodes;
  useDeleteSousIndicateursPeriode: () => DeleteSousIndicateursPeriode;
  useDetachSousIndicateur: () => DetachSousIndicateur;
  useSousIndicateursCommentaires: (
    indicateurId: number
  ) => SousIndicateursCommentaires;
};

const IndicateurSousIndicateursTableContext =
  createContext<IndicateurSousIndicateursTableValue | null>(null);

export const IndicateurSousIndicateursTableProvider = ({
  value,
  children,
}: PropsWithChildren<{
  value: IndicateurSousIndicateursTableValue;
}>): JSX.Element => (
  <IndicateurSousIndicateursTableContext.Provider value={value}>
    {children}
  </IndicateurSousIndicateursTableContext.Provider>
);

export const useIndicateurSousIndicateursTable =
  (): IndicateurSousIndicateursTableValue => {
    const context = useContext(IndicateurSousIndicateursTableContext);
    if (!context) {
      throw new Error(
        'useIndicateurSousIndicateursTable must be used within an IndicateurSousIndicateursTableProvider'
      );
    }
    return context;
  };
