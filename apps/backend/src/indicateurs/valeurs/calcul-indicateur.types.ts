import type {
  IndicateurDefinition,
  IndicateurPeriod,
  IndicateurValeurCreate,
  IndicateurValeurWithIdentifiant,
} from '@tet/domain/indicateurs';
import type { ReferencedIndicateur } from './referenced-indicateur.dto';

export type CalculSourceValeur = IndicateurValeurWithIdentifiant & {
  indicateurIdentifiant: string;
  period: IndicateurPeriod;
  deleted: boolean;
  metadonneeDateVersion: string | null;
};

export type IndicateurFormula = {
  definition: IndicateurDefinition;
  references: ReferencedIndicateur[];
};

export type SourceCalculPolicy = {
  sourceId: string;
  sourceCalculIds: string[];
};

export type CalculSourceGroup = {
  collectiviteId: number;
  period: IndicateurPeriod;
  sourceId: string | null;
  metadonneeId: number | null;
  valeurs: CalculSourceValeur[];
};

export type CalculSourceGroups = Record<string, CalculSourceGroup>;

export type RecomputedIndicateurValeurs = {
  valeursToUpsert: IndicateurValeurCreate[];
  valeurIdsToDelete: number[];
  indicateurIdentifiants: string[];
};
