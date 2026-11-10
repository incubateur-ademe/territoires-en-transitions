-- Verify tet:plan_action/type_electrification on pg

BEGIN;

select 1 / count(*)
from plan_action_type
where categorie = 'Plans thématiques'
  and type = 'Plan Électrification';

ROLLBACK;
