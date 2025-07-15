-- Deploy tet:labellisation/audit to pg
BEGIN;

-- supprime les anicennes fonctions et triggers qui mettaient à jour la table labellisation

-- 1. suite au calcul du score post-audit
drop trigger update_labellisation_after_scores on post_audit_scores;
drop function labellisation.update_labellisation_after_scores;

-- 2. suite à la mise à jour du statut d'un audit ou la màj de la personnalisation des référentiels
drop trigger after_write_update_audit_scores on labellisation.audit;
drop trigger after_write_update_audit_scores on personnalisation_consequence;
drop function labellisation.update_audit_scores;
drop function labellisation.update_audit_score_on_personnalisation;

COMMIT;
