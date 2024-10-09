-- Verify tet:plan_action on pg

BEGIN;

SELECT 'Bloqué'::fiche_action_statuts = any(enum_range(null::fiche_action_statuts));
SELECT 'En retard'::fiche_action_statuts = any(enum_range(null::fiche_action_statuts));
SELECT 'A discuter'::fiche_action_statuts = any(enum_range(null::fiche_action_statuts));

ROLLBACK;
