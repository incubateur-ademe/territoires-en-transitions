-- Verify tet:action_statut on pg

BEGIN;

select collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by, modified_at
from action_statut
where false;

select has_function_privilege('private.check_avancement_detaille_sum()', 'execute');

select collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by, modified_at
from action_statut
where false;

select collectivite_id, modified_by, action_id, avancement, concerne
from client_action_statut
where false;

select collectivite_id, referentiel, action_id, avancement, avancement_detaille, concerne
from business_action_statut
where false;

select id, collectivite_id, referentiel, created_at
from action_statut_update_event
where false;

select has_function_privilege('after_action_statut_insert_write_event()', 'execute');

ROLLBACK;
