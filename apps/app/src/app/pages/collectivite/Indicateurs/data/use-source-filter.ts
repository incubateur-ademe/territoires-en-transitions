import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
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
  'snbc3',
  'pcaet',
  'opendata',
  'collectivite',
  'moyenne',
  'cible',
  'seuil',
] as const;

export type FiltresSource = (typeof FILTRES_SOURCE)[number];

const FILTRES_TRAJECTOIRE: readonly FiltresSource[] = ['snbc', 'snbc3'];

export const filtreSourceToLabel = (
  filtre: FiltresSource,
  avecSnbc3: boolean
): string => {
  switch (filtre) {
    case 'snbc':
      return avecSnbc3 ? appLabels.sourceSnbc2 : appLabels.sourceSnbc;
    case 'snbc3':
      return appLabels.sourceSnbc3;
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

/**
 * Filtres proposés à partir des sources disponibles de l'indicateur (hors
 * collectivité, moyenne et références, ajoutées ensuite).
 * Le backend ne sert `snbc3` qu'aux utilisateurs qui ont le flag SNBC 3.
 */
export const getFiltresSourceDisponibles = (sourceIds: string[]) => {
  const avecSnbc3 = sourceIds.includes('snbc3');
  const options: FiltresSource[] = [];
  if (sourceIds.length) {
    if (sourceIds.includes('snbc')) options.push('snbc');
    if (avecSnbc3) options.push('snbc3');
    if (sourceIds.includes('pcaet')) options.push('pcaet');
    if (sourceIds.length > options.length) options.push('opendata');
  }
  return { avecSnbc3, options };
};

/** Une seule source de trajectoire sélectionnée : ses secteurs s'affichent. */
export const isSeuleTrajectoireSelectionnee = (filtres: FiltresSource[]) =>
  filtres.length === 1 && FILTRES_TRAJECTOIRE.includes(filtres[0]);
export const useSourceFilter = (
  input: GetAvailableSourcesInput & { periodicite?: IndicateurPeriodicite }
) => {
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
    const { avecSnbc3, options } = getFiltresSourceDisponibles(
      data?.map((source) => source.id) ?? []
    );
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
        label: filtreSourceToLabel(value, avecSnbc3),
      })),
      filtresSource,
      setFiltresSource,
      sources: sources.length ? sources : undefined,
      avecDonneesCollectivite:
        !sources.length || sources.includes('collectivite'),
      avecSnbc3,
      avecSecteursSNBC: isSeuleTrajectoireSelectionnee(filtresSource),
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
