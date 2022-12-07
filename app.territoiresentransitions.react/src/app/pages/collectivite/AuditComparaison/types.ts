import {Database} from 'types/database.types';
import {ActionReferentiel} from '../ReferentielTable/useReferentiel';

// alias et règle les imperfections du typage auto-généré
export type TScoreAudit =
  Database['public']['Tables']['type_tabular_score']['Row'];
export type TComparaisonScoreAudit =
  Database['public']['Views']['comparaison_scores_audit']['Row'] & {
    action_id: string;
    pre_audit: TScoreAudit;
    courant: TScoreAudit;
  };

// les lignes passées à la table (une fois complétées par les données du
// référentiel) auront ce type
export type TScoreAuditRowData = TComparaisonScoreAudit & ActionReferentiel;
