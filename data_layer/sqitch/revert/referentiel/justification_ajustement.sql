-- Revert tet:referentiel/justification_ajustement from pg

BEGIN;

drop trigger save_history on justification_ajustement;
drop function historique.save_justification_ajustement;
drop table historique.justification_ajustement;
drop table justification_ajustement;

COMMIT;
