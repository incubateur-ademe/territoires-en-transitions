-- Verify tet:plan_action/fiche_action_etape on pg

BEGIN;

select id,
       fiche_id,
       nom,
       ordre,
       realise,
       modified_at,
       created_at,
       modified_by,
       created_by
from fiche_action_etape
where false;

ROLLBACK;
