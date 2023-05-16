-- Revert tet:evaluation/justification from pg

BEGIN;

drop trigger save_history on justification;
drop function historique.save_justification();
drop table historique.justification;
drop table justification;

COMMIT;
