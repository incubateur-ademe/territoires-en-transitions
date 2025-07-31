import { useState } from 'react';
import { useIndicateurMoyenne } from './use-indicateur-moyenne';
import {
  hasValeurCible,
  hasValeurSeuil,
  useIndicateurReference,
} from './use-indicateur-reference';
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
  'moyenne',
  'cible',
  'seuil',
] as const;

export type FiltresSource = (typeof FILTRES_SOURCE)[number];

const filtreToLabel: Record<FiltresSource, string> = {
  snbc: 'Objectifs SNBC',
  pcaet: 'Objectifs Territoires & Climat',
  opendata: 'Résultats Open data',
  collectivite: 'Données de la collectivité',
  moyenne: 'Moyenne des collectivités de même type',
  cible: 'Valeur cible',
  seuil: 'Valeur limite',
};

/**
 * Conserve l'état du filtre sur les sources de données et fourni le filtre à
 * passer lors de la lecture des valeurs.
 */
export const useSourceFilter = (input: GetAvailableSourcesInput) => {
  // conserve les filtres sur les sources de données
  const [filtresSource, setFiltresSource] = useState<FiltresSource[]>([]);

  const { data, isLoading: isLoadingSources } =
    useIndicateurAvailableSources(input);

  // on charge systématiquement la moyenne pour savoir si on doit l'afficher dans le filtre
  const { data: moyenne, isLoading: isLoadingMoyenne } =
    useIndicateurMoyenne(input);

  // ainsi que le valeurs de référence (cible/seuil)
  const { data: references, isLoading: isLoadingReference } =
    useIndicateurReference(input);
  const avecValeurCible = hasValeurCible(references);
  const avecValeurSeuil = hasValeurSeuil(references);

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
  }
  options.push('collectivite');
  if (moyenne?.valeurs?.length) {
    options.push('moyenne');
  }
  if (avecValeurCible) {
    options.push('cible');
  }
  if (avecValeurSeuil) {
    options.push('seuil');
  }

  const availableOptions = options.map((value) => ({
    value,
    label: filtreToLabel[value],
  }));

  // détermine le filtre sur les sources à appliquer pour la lecture des valeurs
  const sources: Array<string> = [];
  if (filtresSource.length) {
    if (filtresSource.includes('opendata')) {
      if (data?.length) {
        const openSourcesId = data
          .filter((s) => !FILTRES_SOURCE.includes(s.id as FiltresSource))
          .map((s) => s.id);
        sources.push(
          ...openSourcesId,
          ...filtresSource.filter((s) => s !== 'opendata')
        );
      }
    } else {
      sources.push(...filtresSource);
    }
  }

  // indique si les données de la collectivité doivent être incluses
  const avecDonneesCollectivite =
    !sources.length || sources.includes('collectivite');

  // pour afficher les sous-indicateurs avec les données de la trajectoire
  // uniquement quand le filtre SNBC est le seul sélectionné
  const avecSecteursSNBC =
    filtresSource.length === 1 && filtresSource[0] === 'snbc';

  // faleurs références à afficher en fonction du filtre
  const valeursReference = !filtresSource.length
    ? references
    : {
        cible: filtresSource.includes('cible')
          ? references?.cible ?? null
          : null,
        objectifs: filtresSource.includes('cible')
          ? references?.objectifs ?? null
          : null,
        seuil: filtresSource.includes('seuil')
          ? references?.seuil ?? null
          : null,
        libelle: references?.libelle ?? null,
        drom: references?.drom ?? false,
      };

  return {
    isLoading: isLoadingSources || isLoadingMoyenne || isLoadingReference,
    availableOptions,
    filtresSource,
    setFiltresSource,
    sources: sources.length ? sources : undefined,
    avecDonneesCollectivite,
    avecSecteursSNBC,
    moyenne:
      !filtresSource.length || filtresSource.includes('moyenne')
        ? moyenne
        : undefined,
    valeursReference,
  };
};

export type SourceFilter = ReturnType<typeof useSourceFilter>;
