'use client';

import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useCollectiviteId } from '@tet/api/collectivites';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { type PropsWithChildren, useMemo } from 'react';
import { IndicateurFichesLieesProvider } from './indicateur-fiches-liees.context';

export const IndicateurFichesLieesDataProvider = ({
  indicateur,
  children,
}: PropsWithChildren<{ indicateur: IndicateurDetaille }>) => {
  const collectiviteId = useCollectiviteId();
  const { fiches } = useListFiches(collectiviteId, {
    filters: { indicateurIds: [indicateur.id] },
  });
  const value = useMemo(() => ({ fiches }), [fiches]);

  return (
    <IndicateurFichesLieesProvider value={value}>
      {children}
    </IndicateurFichesLieesProvider>
  );
};
