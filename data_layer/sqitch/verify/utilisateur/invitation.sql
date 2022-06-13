-- Verify tet:invitation on pg

BEGIN;

select id, role_name, collectivite_id, created_by, created_at
from private_collectivite_invitation
where false;

select has_function_privilege('create_agent_invitation(integer)', 'execute');
select has_function_privilege('latest_invitation(integer)', 'execute');
select has_function_privilege('accept_invitation(uuid)', 'execute');

ROLLBACK;
