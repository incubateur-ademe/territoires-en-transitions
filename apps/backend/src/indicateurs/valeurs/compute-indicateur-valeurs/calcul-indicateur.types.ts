import type {
  IndicateurPeriode,
  IndicateurPredefini,
  IndicateurValeurCreate,
  IndicateurValeurWithIdentifiant,
} from '@tet/domain/indicateurs';
import type { ReferencedIndicateur } from '../referenced-indicateur.dto';

export type CalculSourceValeur = IndicateurValeurWithIdentifiant & {
  indicateurIdentifiant: string;
  periode: IndicateurPeriode;
  deleted: boolean;
  metadonneeDateVersion: string | null;
};

export type IndicateurFormula = {
  definition: IndicateurPredefini;
  references: ReferencedIndicateur[];
};

export type SourceCalculPolicy = {
  sourceId: string;
  sourceCalculIds: string[];
  requiresDirectValueForField: boolean;
};

export type CalculSourceGroup = {
  collectiviteId: number;
  periode: IndicateurPeriode;
  sourceId: string | null;
  metadonneeId: number | null;
  valeurs: CalculSourceValeur[];
  requiresDirectValueForField: boolean;
};

export type CalculSourceGroups = Record<string, CalculSourceGroup>;

export type RecomputedIndicateurValeurs = {
  valeursToUpsert: IndicateurValeurCreate[];
  valeurIdsToDelete: number[];
  indicateurIdentifiants: string[];
};
