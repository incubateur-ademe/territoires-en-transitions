-- Deploy tet:plan_action/fiches to pg

BEGIN;

drop policy allow_read on fiche_action_effet_attendu;
drop policy allow_insert on fiche_action_effet_attendu;
drop policy allow_update on fiche_action_effet_attendu;
drop policy allow_delete on fiche_action_effet_attendu;

COMMIT;

