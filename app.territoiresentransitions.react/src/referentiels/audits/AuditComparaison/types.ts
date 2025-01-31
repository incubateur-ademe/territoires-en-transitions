import { Tables, Views } from '@/api';
import { ActionReferentiel } from '../../DEPRECATED_scores.types';

// alias et règle les imperfections du typage auto-généré
export type TScoreAudit = Tables<'type_tabular_score'>;
export type TComparaisonScoreAudit = Views<'comparaison_scores_audit'> & {
  action_id: string;
  pre_audit: TScoreAudit;
  courant: TScoreAudit;
};

// les lignes passées à la table (une fois complétées par les données du
// référentiel) auront ce type
export type TScoreAuditRowData = TComparaisonScoreAudit & ActionReferentiel;
