-- Verify tet:plan_action/add_fiche_recursive_axe_view on pg

BEGIN;

SELECT fiche_id, id, nom, parent_id, plan_id, collectivite_id, axe_level FROM fiche_recursive_axe
WHERE FALSE;

ROLLBACK;
