-- Revert tet:referentiel/vue_tabulaire from pg

BEGIN;

drop view action_statuts;
drop view private.action_scores;
drop view action_hierarchy;

COMMIT;
