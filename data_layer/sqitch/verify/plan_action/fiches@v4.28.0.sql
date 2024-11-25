-- Verify tet:plan_action/fiches on pg

BEGIN;

SELECT created_by from fiche_action where false;

ROLLBACK;
