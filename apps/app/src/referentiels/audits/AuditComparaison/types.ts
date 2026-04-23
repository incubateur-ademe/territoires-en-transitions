import { Tables, Views } from '@tet/api';

// alias et règle les imperfections du typage auto-généré
export type TScoreAudit = Tables<'type_tabular_score'>;
export type TComparaisonScoreAudit = Views<'comparaison_scores_audit'> & {
  action_id: string;
  pre_audit: TScoreAudit;
  courant: TScoreAudit;
};

// Données de comparaison construites depuis les snapshots (ecore)
import type {
  ComparaisonRowFromSnapshot,
  TabularScoreFromSnapshot,
} from './snapshot-to-tabular';

export type { ComparaisonRowFromSnapshot, TabularScoreFromSnapshot };

// Lignes de la table de comparaison (snapshot)
export type TScoreAuditRowData = ComparaisonRowFromSnapshot;

/** Données d’en-tête pour la table de comparaison (pre_audit/courant suffisent pour l’affichage) */
export type AuditComparisonHeaderData = {
  pre_audit?: TabularScoreFromSnapshot;
  courant?: TabularScoreFromSnapshot;
};
