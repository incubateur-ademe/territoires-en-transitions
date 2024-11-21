-- Revert tet:plan_action/fiche_action_etape from pg

BEGIN;

drop table fiche_action_etape;

COMMIT;
