'use client';

import { useRenameSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-rename-sous-indicateur';
import { useCreateSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-create-sous-indicateur';
import { useUpdateSousIndicateursCumul } from '@/app/indicateurs/sous-indicateurs/data/use-update-sous-indicateurs-cumul';
import { useDetachSousIndicateur } from '@/app/indicateurs/sous-indicateurs/data/use-detach-sous-indicateur';
import { useSousIndicateursCommentaires } from '@/app/indicateurs/sous-indicateurs/data/use-sous-indicateurs-commentaires';
import { useDeleteSousIndicateursPeriode } from '@/app/indicateurs/sous-indicateurs/data/use-delete-sous-indicateurs-periode';
import { useDeclareSousIndicateursPeriodes } from '@/app/indicateurs/sous-indicateurs/data/use-declare-sous-indicateurs-periodes';
import { useSaveSousIndicateurValeur } from '@/app/indicateurs/sous-indicateurs/data/use-save-sous-indicateur-valeur';
import { useSousIndicateursTable } from '@/app/indicateurs/sous-indicateurs/data/use-sous-indicateurs-table';
import type { JSX, PropsWithChildren } from 'react';
import {
  IndicateurSousIndicateursTableProvider,
  type IndicateurSousIndicateursTableValue,
} from '../context/indicateur-sous-indicateurs-table.context';

const SOUS_INDICATEURS_TABLE_VALUE: IndicateurSousIndicateursTableValue = {
  useSousIndicateursTable,
  useSaveSousIndicateurValeur,
  useDeclareSousIndicateursPeriodes,
  useDeleteSousIndicateursPeriode,
  useDetachSousIndicateur,
  useCreateSousIndicateur,
  useRenameSousIndicateur,
  useUpdateSousIndicateursCumul,
  useSousIndicateursCommentaires,
};

export const IndicateurSousIndicateursTableDataProvider = ({
  children,
}: PropsWithChildren): JSX.Element => (
  <IndicateurSousIndicateursTableProvider value={SOUS_INDICATEURS_TABLE_VALUE}>
    {children}
  </IndicateurSousIndicateursTableProvider>
);
