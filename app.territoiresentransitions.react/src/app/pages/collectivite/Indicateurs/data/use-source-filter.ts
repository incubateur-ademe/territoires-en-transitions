import { useState } from 'react';
import { useIndicateurSources } from './use-indicateur-sources';

// liste des filtres sur les sources de données
export const FILTRES_SOURCE = [
  'snbc',
  'opendata',
  'collectivite',
  /*
  'moyenne',
  'cible',
  'seuil',
  */
] as const;
export type FiltresSource = (typeof FILTRES_SOURCE)[number];

/**
 * Conserve l'état du filtre sur les sources de données et fourni le filtre à
 * passer lors de la lecture des valeurs.
 */
export const useSourceFilter = () => {
  // conserve les filtres sur les sources de données
  const [filtresSource, setFiltresSource] = useState<FiltresSource[]>([]);

  const { data, isLoading } = useIndicateurSources();

  // détermine le filtre sur les sources à appliquer pour la lecture des valeurs
  const sources: Array<string> = [];
  if (filtresSource.length && data?.length) {
    if (filtresSource.includes('snbc')) {
      sources.push('snbc');
    }
    if (filtresSource.includes('opendata')) {
      const openSourcesId = data
        .filter((s) => s.id !== 'snbc')
        .map((s) => s.id);
      sources.push(...openSourcesId);
    }
    if (filtresSource.includes('collectivite')) {
      sources.push('collectivite');
    }
  }

  // indique si les données de la collectivité doivent être incluses
  const avecDonneesCollectivite = !sources.length || sources.includes('collectivite');

  return {
    isLoading,
    filtresSource,
    setFiltresSource,
    sources: sources.length ? sources : undefined,
    avecDonneesCollectivite,
  };
};

export type SourceFilter = ReturnType<typeof useSourceFilter>;
