-- Verify tet:plan_action on pg

BEGIN;

SELECT created_by from fiche_action limit 1;

ROLLBACK;
