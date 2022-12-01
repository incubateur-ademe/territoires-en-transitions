-- Revert tet:labellisation/comparaison_audit from pg

BEGIN;

drop trigger after_write_update_audit_scores on audit;
drop trigger after_write_update_audit_scores on personnalisation_consequence;
drop function labellisation.update_audit_score_on_personnalisation;
drop function labellisation.update_audit_scores;
drop function labellisation.evaluate_audit_statuts;
drop function labellisation.audit_evaluation_payload;
drop function labellisation.pre_audit_service_statuts;
drop table pre_audit_scores;

COMMIT;
