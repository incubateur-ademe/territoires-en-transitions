-- Verify tet:panier_action_impact/plan_action on pg

BEGIN;

select modified_at, id, nom, collectivite_id, parent, created_at, modified_by, plan, type, panier_id
from axe
where false;

select has_function_privilege('plan_from_panier(integer, uuid)', 'execute');

ROLLBACK;
