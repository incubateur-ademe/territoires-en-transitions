import { groupBy } from 'es-toolkit';
import type {
  IndicateurSourceMetadonnee,
  IndicateurValeurGroupee,
} from '@tet/domain/indicateurs';
import type { UpsertIndicateurValeurInput } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import {
  CellKey,
  CellValueInput,
  generateCellKey,
  GridCell,
  OpenDataSource,
  toIndicateurId,
  toSourceId,
  toYear,
  ValeurField,
  Year,
} from '../types';

const COLLECTIVITE_SOURCE_ID = 'collectivite';

const yearOf = (dateValeur: string): Year => toYear(Number(dateValeur.slice(0, 4)));

const dateValeurForYear = (year: Year): string => `${year}-01-01`;

type ValeurGroupee = Pick<
  IndicateurValeurGroupee,
  'id' | 'dateValeur' | 'resultat' | 'objectif' | 'metadonneeId'
>;

type SourceMetadonnee = Pick<
  IndicateurSourceMetadonnee,
  'id' | 'methodologie' | 'dateVersion'
>;

type SourceGroupee = {
  libelle: string;
  metadonnees: SourceMetadonnee[];
  valeurs: ValeurGroupee[];
};

export type IndicateurAvecSources = {
  definition: { id: number };
  sources: Record<string, SourceGroupee>;
};

export type ValeurUpsertContext = {
  collectiviteId: number;
  referenceYear: Year | null;
};

export const fieldForYear = (
  year: Year,
  referenceYear: Year | null
): ValeurField => {
  const isHorizonYear = referenceYear !== null && year > referenceYear;
  return isHorizonYear ? 'objectif' : 'resultat';
};

const fieldValueForYear = (
  valeur: ValeurGroupee,
  year: Year,
  referenceYear: Year | null
): number | null =>
  (fieldForYear(year, referenceYear) === 'resultat'
    ? valeur.resultat
    : valeur.objectif) ?? null;

type CoveringAtYear = { year: Year; source: OpenDataSource };

const sourceCoverings = (
  sourceId: string,
  group: SourceGroupee,
  referenceYear: Year | null
): CoveringAtYear[] =>
  group.valeurs.flatMap((valeur): CoveringAtYear[] => {
    const year = yearOf(valeur.dateValeur);
    const value = fieldValueForYear(valeur, year, referenceYear);
    if (value === null) {
      return [];
    }
    const metadonnee = group.metadonnees.find((m) => m.id === valeur.metadonneeId);
    return [
      {
        year,
        source: {
          sourceId: toSourceId(sourceId),
          libelle: group.libelle,
          value,
          methodologie: metadonnee?.methodologie ?? null,
          dateVersion: metadonnee?.dateVersion ?? '',
        },
      },
    ];
  });

const coveringSourcesByYear = (
  sources: Record<string, SourceGroupee>,
  referenceYear: Year | null
): Map<Year, OpenDataSource[]> => {
  const coverings = Object.entries(sources)
    .filter(([sourceId]) => sourceId !== COLLECTIVITE_SOURCE_ID)
    .flatMap(([sourceId, group]) =>
      sourceCoverings(sourceId, group, referenceYear)
    );

  return new Map(
    Object.entries(groupBy(coverings, (covering) => covering.year)).map(
      ([year, group]) => [toYear(Number(year)), group.map((covering) => covering.source)]
    )
  );
};

export const fromIndicateur = (
  indicateurs: IndicateurAvecSources[],
  referenceYear: Year | null
): Map<CellKey, GridCell> =>
  new Map(
    indicateurs.flatMap(({ definition, sources }) => {
      const indicateurId = toIndicateurId(definition.id);
      const userValues = sources[COLLECTIVITE_SOURCE_ID]?.valeurs ?? [];
      const covering = coveringSourcesByYear(sources, referenceYear);

      const userValueByYear = new Map(
        userValues.map((valeur) => [yearOf(valeur.dateValeur), valeur])
      );
      const years = new Set([...userValueByYear.keys(), ...covering.keys()]);

      return Array.from(years, (year): [CellKey, GridCell] => {
        const userValue = userValueByYear.get(year);
        return [
          generateCellKey(indicateurId, year),
          {
            kind: 'user-data',
            value: userValue
              ? fieldValueForYear(userValue, year, referenceYear)
              : null,
            coveringSources: covering.get(year) ?? [],
          },
        ];
      });
    })
  );

export const toIndicateur = (
  { indicateurId, year, value }: CellValueInput,
  { collectiviteId, referenceYear }: ValeurUpsertContext
): UpsertIndicateurValeurInput => {
  const field = fieldForYear(year, referenceYear);
  return {
    collectiviteId,
    indicateurId,
    dateValeur: dateValeurForYear(year),
    resultat: field === 'resultat' ? value : undefined,
    objectif: field === 'objectif' ? value : undefined,
  };
};
