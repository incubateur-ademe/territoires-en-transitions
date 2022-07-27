-- Verify tet:droits on pg

BEGIN;

select id, user_id, collectivite_id, role_name, active, created_at, modified_at
from private_utilisateur_droit
where false;

select has_function_privilege('is_any_role_on(integer)', 'execute');
select has_function_privilege('is_amongst_role_on(role_name[], integer)', 'execute');
select has_function_privilege('is_role_on(role_name, integer)', 'execute');
select has_function_privilege('is_referent_of(integer)', 'execute');
select has_function_privilege('is_agent_of(integer)', 'execute');

select collectivite_id, nom
from active_collectivite
where false;

select collectivite_id, nom, role_name
from owned_collectivite
where false;

select collectivite_id, nom
from elses_collectivite
where false;


select has_function_privilege('claim_collectivite(integer)', 'execute');
select has_function_privilege('quit_collectivite(integer)', 'execute');
select has_function_privilege('referent_contact(integer)', 'execute');

ROLLBACK;
