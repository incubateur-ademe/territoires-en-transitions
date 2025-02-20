import { useState } from 'react';
import {
  GetAvailableSourcesInput,
  useIndicateurAvailableSources,
} from './use-indicateur-sources';

// liste des filtres sur les sources de données
const FILTRES_SOURCE = [
  'snbc',
  'pcaet',
  'opendata',
  'collectivite',
  /*
  'moyenne',
  'cible',
  'seuil',
  */
] as const;

export type FiltresSource = (typeof FILTRES_SOURCE)[number];

const filtreToLabel: Record<FiltresSource, string> = {
  snbc: 'Objectifs SNBC',
  pcaet: 'Objectifs Territoires & Climat',
  opendata: 'Résultats Open data',
  collectivite: 'Données de la collectivité',
  /*
   moyenne: 'Moyenne',
   cible: 'Valeur cible',
   seuil: 'Valeur seuil',
   */
};

/**
 * Conserve l'état du filtre sur les sources de données et fourni le filtre à
 * passer lors de la lecture des valeurs.
 */
export const useSourceFilter = (input: GetAvailableSourcesInput) => {
  // conserve les filtres sur les sources de données
  const [filtresSource, setFiltresSource] = useState<FiltresSource[]>([]);

  const { data, isLoading } = useIndicateurAvailableSources(input);

  // génère la liste des options possibles en fonction des sources disponibles
  const options: FiltresSource[] = [];
  if (data?.length) {
    const availableSourceIds = data.map((s) => s.id);
    if (availableSourceIds.includes('snbc')) {
      options.push('snbc');
    }
    if (availableSourceIds.includes('pcaet')) {
      options.push('pcaet');
    }
    // il y a d'autres sources open data disponibles
    if (availableSourceIds.length > options.length) {
      options.push('opendata');
    }
    options.push('collectivite');
  }
  const availableOptions = options.map((value) => ({
    value,
    label: filtreToLabel[value],
  }));

  // détermine le filtre sur les sources à appliquer pour la lecture des valeurs
  const sources: Array<string> = [];
  if (filtresSource.length && data?.length) {
    if (filtresSource.includes('snbc')) {
      sources.push('snbc');
    }
    if (filtresSource.includes('pcaet')) {
      sources.push('pcaet');
    }
    if (filtresSource.includes('opendata')) {
      const openSourcesId = data
        .filter((s) => !FILTRES_SOURCE.includes(s.id as FiltresSource))
        .map((s) => s.id);
      sources.push(...openSourcesId);
    }
    if (filtresSource.includes('collectivite')) {
      sources.push('collectivite');
    }
  }

  // indique si les données de la collectivité doivent être incluses
  const avecDonneesCollectivite =
    !sources.length || sources.includes('collectivite');

  // pour afficher les sous-indicateurs avec les données de la trajectoire
  // uniquement quand le filtre SNBC est le seul sélectionné
  const avecSecteursSNBC =
    filtresSource.length === 1 && filtresSource[0] === 'snbc';

  return {
    isLoading,
    availableOptions,
    filtresSource,
    setFiltresSource,
    sources: sources.length ? sources : undefined,
    avecDonneesCollectivite,
    avecSecteursSNBC,
  };
};

export type SourceFilter = ReturnType<typeof useSourceFilter>;
