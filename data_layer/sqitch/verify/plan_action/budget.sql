-- Verify tet:plan_action/budget on pg

BEGIN;

select id,
       fiche_id,
       type,
       unite,
       annee,
       budget_previsionnel,
       budget_reel,
       est_etale
from fiche_action_budget
where false;

ROLLBACK;
