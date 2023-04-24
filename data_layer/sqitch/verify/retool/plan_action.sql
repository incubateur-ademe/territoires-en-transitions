-- Verify tet:retool/plan_action on pg

BEGIN;

select collectivite_id,
       nom,
       fiche,
       created_at,
       email
from retool_plan_action_premier_usage
where false;

select collectivite_id,
       nom,
       fiche,
       created_at,
       email
from private.retool_plan_action_premier_usage
where false;

ROLLBACK;
