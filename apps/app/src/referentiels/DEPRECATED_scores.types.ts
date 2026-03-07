import { TActionStatutsRow } from '../types/alias';

/**
 * Champs de base d’une ligne « action » du référentiel (table action_referentiel).
 * Utilisé par le hook legacy useReferentiel et par certaines vues (AuditSuivi, BibliothequeDocs).
 */
export type ActionReferentiel = Pick<
  TActionStatutsRow,
  | 'action_id'
  | 'identifiant'
  | 'nom'
  | 'depth'
  | 'have_children'
  | 'type'
  | 'phase'
>;
