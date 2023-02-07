-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

drop trigger supprimer_score_avant_audit on audit ;
drop function supprimer_score_avant_audit;

COMMIT;
