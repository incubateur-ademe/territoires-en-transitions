-- Verify tet:collectivites on pg

BEGIN;

select id, created_at, modified_at, access_restreint
from collectivite where false;

select has_function_privilege('can_read_acces_restreint(integer)', 'execute');

ROLLBACK;
