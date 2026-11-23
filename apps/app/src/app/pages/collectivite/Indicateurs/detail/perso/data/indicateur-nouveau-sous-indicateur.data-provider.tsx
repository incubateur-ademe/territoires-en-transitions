'use client';

import { useMemo, useState, type JSX, type PropsWithChildren } from 'react';
import {
  IndicateurNouveauSousIndicateurProvider,
  type IndicateurNouveauSousIndicateurValue,
} from '../context/indicateur-nouveau-sous-indicateur.context';

export const IndicateurNouveauSousIndicateurDataProvider = ({
  children,
}: PropsWithChildren): JSX.Element => {
  const [id, setId] = useState<number | null>(null);
  const value = useMemo<IndicateurNouveauSousIndicateurValue>(
    () => ({
      id,
      onCreated: setId,
      onNameEditingEnd: () => setId(null),
    }),
    [id]
  );

  return (
    <IndicateurNouveauSousIndicateurProvider value={value}>
      {children}
    </IndicateurNouveauSousIndicateurProvider>
  );
};
