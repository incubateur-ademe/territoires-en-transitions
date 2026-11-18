'use client';

import { useSousIndicateursTable } from '@/app/indicateurs/sous-indicateurs/data/use-sous-indicateurs-table';
import type { JSX, PropsWithChildren } from 'react';
import {
  IndicateurSousIndicateursTableProvider,
  type IndicateurSousIndicateursTableValue,
} from '../context/indicateur-sous-indicateurs-table.context';

const SOUS_INDICATEURS_TABLE_VALUE: IndicateurSousIndicateursTableValue = {
  useSousIndicateursTable,
};

export const IndicateurSousIndicateursTableDataProvider = ({
  children,
}: PropsWithChildren): JSX.Element => (
  <IndicateurSousIndicateursTableProvider value={SOUS_INDICATEURS_TABLE_VALUE}>
    {children}
  </IndicateurSousIndicateursTableProvider>
);
