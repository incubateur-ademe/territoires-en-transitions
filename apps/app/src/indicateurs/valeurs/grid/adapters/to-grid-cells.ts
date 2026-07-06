import { groupBy, isNil } from 'es-toolkit';
import {
  CellKey,
  generateCellKey,
  GridCell,
  OpenDataSource,
  toIndicateurId,
  toSourceId,
  toYear,
  Year,
} from '../types';

const COLLECTIVITE_SOURCE_ID = 'collectivite';

const yearOf = (dateValeur: string): Year => toYear(Number(dateValeur.slice(0, 4)));

type ValeurGroupee = {
  id: number;
  dateValeur: string;
  resultat?: number | null;
  metadonneeId?: number | null;
};

type SourceMetadonnee = {
  id: number;
  methodologie: string | null;
  dateVersion: string;
};

type SourceGroupee = {
  libelle: string;
  metadonnees: SourceMetadonnee[];
  valeurs: ValeurGroupee[];
};

export type IndicateurAvecSources = {
  definition: { id: number };
  sources: Record<string, SourceGroupee>;
};

type CoveringAtYear = { year: Year; source: OpenDataSource };

const sourceCoverings = (
  sourceId: string,
  group: SourceGroupee
): CoveringAtYear[] =>
  group.valeurs.flatMap((valeur): CoveringAtYear[] => {
    if (isNil(valeur.resultat)) {
      return [];
    }
    const metadonnee = group.metadonnees.find((m) => m.id === valeur.metadonneeId);
    return [
      {
        year: yearOf(valeur.dateValeur),
        source: {
          sourceId: toSourceId(sourceId),
          libelle: group.libelle,
          value: valeur.resultat,
          methodologie: metadonnee?.methodologie ?? null,
          dateVersion: metadonnee?.dateVersion ?? '',
        },
      },
    ];
  });

const coveringSourcesByYear = (
  sources: Record<string, SourceGroupee>
): Map<Year, OpenDataSource[]> => {
  const coverings = Object.entries(sources)
    .filter(([sourceId]) => sourceId !== COLLECTIVITE_SOURCE_ID)
    .flatMap(([sourceId, group]) => sourceCoverings(sourceId, group));

  return new Map(
    Object.entries(groupBy(coverings, (covering) => covering.year)).map(
      ([year, group]) => [toYear(Number(year)), group.map((covering) => covering.source)]
    )
  );
};

export const toGridCells = (
  indicateurs: IndicateurAvecSources[]
): Map<CellKey, GridCell> =>
  new Map(
    indicateurs.flatMap(({ definition, sources }) => {
      const indicateurId = toIndicateurId(definition.id);
      const userValues = sources[COLLECTIVITE_SOURCE_ID]?.valeurs ?? [];
      const covering = coveringSourcesByYear(sources);

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
            value: userValue?.resultat ?? null,
            valueId: userValue?.id,
            coveringSources: covering.get(year) ?? [],
          },
        ];
      });
    })
  );
