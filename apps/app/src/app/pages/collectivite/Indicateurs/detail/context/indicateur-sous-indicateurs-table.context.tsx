'use client';

import type { SousIndicateurOpenData } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-open-data.rules';
import type { SousIndicateursQueryOptions } from '@/app/indicateurs/sous-indicateurs/data/use-sous-indicateurs-queries';
import type { RenameSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-rename-sous-indicateur';
import type { CreateSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-create-sous-indicateur';
import type { DetachSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-detach-sous-indicateur';
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
import type { IndicateurPeriodeCommentaires } from '../../table/use-indicateur-periode-commentaires';

export type IndicateurSousIndicateursTableValue = {
  useSousIndicateursTable: (
    indicateurId: number,
    options: SousIndicateursQueryOptions
  ) => SousIndicateursTableState;
  useSaveSousIndicateurValeur: () => SaveSousIndicateurValeur;
  useDeclareSousIndicateursPeriodes: () => DeclareIndicateursPeriodes;
  useDeleteSousIndicateursPeriode: () => DeleteSousIndicateursPeriode;
  useDetachSousIndicateur: () => DetachSousIndicateur;
  useCreateSousIndicateur: () => CreateSousIndicateur;
  useRenameSousIndicateur: () => RenameSousIndicateur;
  useSousIndicateursOpenData: (
    indicateurIds: readonly number[]
  ) => ReadonlyMap<number, SousIndicateurOpenData>;
  useIndicateurPeriodeCommentaires: () => IndicateurPeriodeCommentaires;
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
