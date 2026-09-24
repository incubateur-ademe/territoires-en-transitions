/** Transforme les données pour l'affichage dans le tableau */

import { RouterOutput } from '@tet/api';
import {
  aggregateIndicateurValeurs,
  type IndicateurAggregationOptions,
  type IndicateurDisplayValeur,
  formatIndicateurPeriod,
  IndicateurPeriod,
  IndicateurPeriods,
  IndicateurValeurGroupee,
  IndicateurValeursGroupeeParSource,
} from '@tet/domain/indicateurs';
import { SourceType } from '../types';

export type ListIndicateurValeursOutput =
  RouterOutput['indicateurs']['valeurs']['list'];

type IndicateurSources = ListIndicateurValeursOutput['indicateurs'][number];

type IndicateurSourceData = IndicateurSources['sources'][number];
export type IndicateurSourceValeur = IndicateurSourceData['valeurs'][number];

type PreparedSourceValue = {
  id: IndicateurSourceValeur['id'] | undefined;
  isAggregated?: boolean;
  valeursSources?: readonly IndicateurSourceValeur[];
  calculAuto: boolean;
  periode: IndicateurPeriod;
  periodeLabel: string;
  dateValeurISO: string;
  valeur: number | null | undefined;
  commentaire: string | null | undefined;
};

type PreparedSource = Omit<IndicateurValeursGroupeeParSource, 'valeurs'> & {
  calculAuto: boolean;
  valeurs: PreparedSourceValue[];
  type: SourceType;
  seriesKey?: string;
  periodiciteSource?: IndicateurPeriod['periodicite'];
};

export type PreparedValue = IndicateurValeurGroupee & {
  periode: IndicateurPeriod;
  periodeLabel: string;
};

export type PreparedData = {
  indicateurId: number | undefined;
  dernierePeriodeModePrive: IndicateurPeriod | undefined;
  periodes: IndicateurPeriod[];
  sources: PreparedSource[];
  donneesCollectivite: PreparedSource | undefined;
  valeursExistantes: PreparedValue[];
  isAggregated?: boolean;
};

/** Prépare les données pour l'affichage dans le tableau */
export const prepareData = (
  data: IndicateurSources | undefined,
  type: SourceType,
  avecDonneesCollectiviteVides: boolean,
  additionalSources: readonly PreparedSource[] = [],
  displayOptions?: IndicateurAggregationOptions
): PreparedData => {
  // conserve uniquement les sources ayant des valeurs pour le type de données voulu
  const { collectivite, ...autresSources } = data?.sources || {};
  const sourcesFiltrees = autresSources
    ? Object.values(autresSources).filter((sourceData) =>
        sourceData.valeurs.some((v) => typeof v[type] === 'number')
      )
    : [];
  if (collectivite) {
    sourcesFiltrees.unshift(collectivite);
  }

  // transforme les valeurs de chaque source
  const sourcesEtValeursModifiees: PreparedSource[] = sourcesFiltrees.flatMap(
    (sourceData) => {
      if (!data) return [];
      const groups = new Map<
        string,
        IndicateurDisplayValeur<IndicateurSourceValeur>[]
      >();
      const displayValeurs = aggregateIndicateurValeurs(sourceData.valeurs, {
        periodiciteAffichage: data.definition.periodicite,
        ...displayOptions,
      });
      for (const value of displayValeurs) {
        const key = `${value.periodiciteSource}:${
          value.metadonneeId ?? 'local'
        }`;
        const group = groups.get(key);
        if (group) group.push(value);
        else groups.set(key, [value]);
      }
      // Keep an empty local source visible for declaration.
      if (!groups.size) groups.set('empty', []);
      return Array.from(groups, ([key, values]) => ({
        ...sourceData,
        ...(groups.size > 1 ||
        (values[0] &&
          values[0].periodiciteSource !==
            (displayOptions?.periodiciteAffichage ??
              data.definition.periodicite))
          ? {
              seriesKey: `${sourceData.source}:${key}`,
              periodiciteSource: values[0]?.periodiciteSource,
            }
          : {}),
        calculAuto: sourceData.valeurs.some((v) => v.calculAuto) || false,
        valeurs: values.map((value): PreparedSourceValue => {
          const original = value.valeursSources[0];
          const periode = value.period;
          const commentaire = value.isAggregated
            ? value.valeursSources
                .flatMap((source) => {
                  const comment = source[`${type}Commentaire`];
                  return comment
                    ? [
                        `${formatIndicateurPeriod(
                          IndicateurPeriods.fromDateValeur(
                            source.periodicite,
                            source.dateValeur
                          )
                        )} : ${comment}`,
                      ]
                    : [];
                })
                .join('\n\n')
            : original[`${type}Commentaire`];
          return {
            id: value.isAggregated ? undefined : original.id,
            calculAuto: value.valeursSources.some((source) =>
              Boolean(source.calculAuto)
            ),
            periode,
            periodeLabel: formatIndicateurPeriod(periode),
            dateValeurISO: `${value.dateValeur}T00:00:00.000Z`,
            valeur: value[type],
            commentaire,
            ...(value.isAggregated
              ? { isAggregated: true, valeursSources: value.valeursSources }
              : {}),
          };
        }),
        metadonnees: (sourceData.metadonnees || []).filter(
          (metadata) =>
            !values.length ||
            values.some((value) => value.metadonneeId === metadata.id)
        ),
        type,
      }));
    }
  );

  // trie les sources par ordre alphabétique
  // et place les données de la collectivité en premier
  const sources = [...sourcesEtValeursModifiees, ...additionalSources].sort(
    (a, b) => {
      if (a.source === b.source) return 0;
      if (a.source === 'collectivite') return -1;
      if (b.source === 'collectivite') return 1;
      return a.source.localeCompare(b.source);
    }
  );

  // ajoute une source vide pour les données de la collectivité si elles n'existent pas
  // afin que la ligne soit toujours affichée dans le tableau
  // (sauf si le flag `avecDonneesCollectiviteVides` n'est pas activé)
  let donneesCollectivite =
    sources.find(
      (source) =>
        source.source === 'collectivite' &&
        (!source.periodiciteSource ||
          source.periodiciteSource === data?.definition.periodicite)
    ) ?? sources.find((source) => source.source === 'collectivite');
  if (!donneesCollectivite && avecDonneesCollectiviteVides) {
    donneesCollectivite = {
      source: 'collectivite',
      calculAuto: false,
      valeurs: [],
      metadonnees: [],
      ordreAffichage: -1,
      libelle: '',
      type,
    };
    sources.unshift(donneesCollectivite);
  }

  // dernière période pour laquelle le résultat peut être en mode privé
  let dernierePeriodeModePrive: IndicateurPeriod | undefined;
  if (type === 'resultat') {
    dernierePeriodeModePrive = donneesCollectivite?.valeurs
      .filter((v) => v.valeur !== null && v.valeur !== undefined)
      .map((v) => v.periode)
      .sort(IndicateurPeriods.compareTotal)
      .pop();
  }

  // tableau des valeurs existantes (permet de vérifier s'il existe déjà une ligne pour une année)
  const valeursExistantes: PreparedValue[] =
    data?.sources?.collectivite?.valeurs?.map((v) => {
      const periode = IndicateurPeriods.fromDateValeur(
        v.periodicite,
        v.dateValeur
      );
      return {
        ...v,
        periode,
        periodeLabel: formatIndicateurPeriod(periode),
      };
    }) || [];

  return {
    indicateurId: data?.definition.id,
    dernierePeriodeModePrive,
    periodes: getPeriodesDistinctes(sources),
    sources,
    donneesCollectivite,
    valeursExistantes,
    ...(sources.some((source) =>
      source.valeurs.some((value) => value.isAggregated)
    )
      ? { isAggregated: true }
      : {}),
  };
};

function getPeriodesDistinctes(sources: PreparedSource[]): IndicateurPeriod[] {
  const toutesValeurs = sources.flatMap((sourceData) => sourceData.valeurs);
  return [
    ...new Map(
      toutesValeurs.map((value) => [
        IndicateurPeriods.key(value.periode),
        value.periode,
      ])
    ).values(),
  ].sort(IndicateurPeriods.compareTotal);
}
