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
  toIndicateurId,
  toYear,
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

export const fromIndicateur = (
  indicateurs: IndicateurAvecSources[]
): Map<CellKey, GridCell> =>
  new Map(
    indicateurs.flatMap(({ definition, sources }) => {
      const indicateurId = toIndicateurId(definition.id);
      const userValues = sources[COLLECTIVITE_SOURCE_ID]?.valeurs ?? [];
      return userValues.map((valeur): [CellKey, GridCell] => {
        const year = yearOf(valeur.dateValeur);
        return [
          generateCellKey(indicateurId, year),
          {
            resultat: valeur.resultat ?? null,
            objectif: valeur.objectif ?? null,
          },
        ];
      });
    })
  );

export const toIndicateur = (
  { indicateurId, year, field, value }: CellValueInput,
  { collectiviteId }: { collectiviteId: number }
): UpsertIndicateurValeurInput => ({
  collectiviteId,
  indicateurId,
  dateValeur: dateValeurForYear(year),
  resultat: field === 'resultat' ? value : undefined,
  objectif: field === 'objectif' ? value : undefined,
});
