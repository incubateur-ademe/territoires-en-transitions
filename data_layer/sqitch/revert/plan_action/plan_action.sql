-- Deploy tet:plan_action to pg

BEGIN;

-- ENUM fiche_action_statuts
-- Unfortunately not possible to remove an enum value in postgres for now
--

DROP FUNCTION axe_enfant(axe);

COMMIT;
