import { appLabels } from '@/app/labels/catalog';
import { useMemo, useState } from 'react';
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

const filtreToLabel = (filtre: FiltresSource): string => {
  switch (filtre) {
    case 'snbc':
      return appLabels.sourceSnbc;
    case 'pcaet':
      return appLabels.sourcePcaet;
    case 'opendata':
      return appLabels.sourceOpendata;
    case 'collectivite':
      return appLabels.sourceCollectivite;
    case 'moyenne':
      return appLabels.sourceMoyenne;
    case 'cible':
      return appLabels.sourceCible;
    case 'seuil':
      return appLabels.sourceSeuil;
  }
};

export const useSourceFilter = (input: GetAvailableSourcesInput) => {
  const [filtresSource, setFiltresSource] = useState<FiltresSource[]>([]);

  const { data, isLoading: isLoadingSources } =
    useIndicateurAvailableSources(input);

  const { data: moyenne, isLoading: isLoadingMoyenne } =
    useIndicateurMoyenne(input);

  const { data: references, isLoading: isLoadingReference } =
    useIndicateurReference(input);

  return useMemo(() => {
    const avecValeurCible = hasValeurCible(references);
    const avecValeurSeuil = hasValeurSeuil(references);
    const options: FiltresSource[] = [];

    if (data?.length) {
      const availableSourceIds = data.map((source) => source.id);
      if (availableSourceIds.includes('snbc')) options.push('snbc');
      if (availableSourceIds.includes('pcaet')) options.push('pcaet');
      if (availableSourceIds.length > options.length) options.push('opendata');
    }
    options.push('collectivite');
    if (moyenne?.valeurs?.length) options.push('moyenne');
    if (avecValeurCible) options.push('cible');
    if (avecValeurSeuil) options.push('seuil');

    const sources: string[] = [];
    if (filtresSource.includes('opendata')) {
      if (data?.length) {
        sources.push(
          ...data
            .filter(
              (source) => !FILTRES_SOURCE.includes(source.id as FiltresSource)
            )
            .map((source) => source.id),
          ...filtresSource.filter((source) => source !== 'opendata')
        );
      }
    } else {
      sources.push(...filtresSource);
    }

    return {
      isLoading: isLoadingSources || isLoadingMoyenne || isLoadingReference,
      availableOptions: options.map((value) => ({
        value,
        label: filtreToLabel(value),
      })),
      filtresSource,
      setFiltresSource,
      sources: sources.length ? sources : undefined,
      avecDonneesCollectivite:
        !sources.length || sources.includes('collectivite'),
      avecSecteursSNBC:
        filtresSource.length === 1 && filtresSource[0] === 'snbc',
      moyenne:
        !filtresSource.length || filtresSource.includes('moyenne')
          ? moyenne
          : undefined,
      valeursReference: !filtresSource.length
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
          },
    };
  }, [
    data,
    filtresSource,
    isLoadingMoyenne,
    isLoadingReference,
    isLoadingSources,
    moyenne,
    references,
  ]);
};

export type SourceFilter = ReturnType<typeof useSourceFilter>;
