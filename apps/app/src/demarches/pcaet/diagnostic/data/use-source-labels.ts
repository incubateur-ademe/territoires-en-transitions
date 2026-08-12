'use client';

import { useIndicateurSources } from '@/app/app/pages/collectivite/Indicateurs/data/use-indicateur-sources';
import { useMemo } from 'react';

/**
 * Libellés des sources d'indicateurs, par identifiant. Le diagnostic ne reçoit
 * que des identifiants de source : c'est ici que « rare » devient
 * « RARE-OREC ». À défaut de libellé chargé, l'identifiant fait l'affaire.
 */
export const useSourceLabels = (): ((sourceId: string) => string) => {
  const { data } = useIndicateurSources();

  const labels = useMemo(
    () => new Map((data ?? []).map((source) => [source.id, source.libelle])),
    [data]
  );

  return useMemo(
    () => (sourceId: string) => labels.get(sourceId) ?? sourceId,
    [labels]
  );
};
