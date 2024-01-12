-- Verify tet:automatisation/newsletters on pg

BEGIN;

select nom, api_key, url
from automatisation.supabase_function_url
where false;

select has_function_privilege('automatisation.send_pa_users_newsletters()', 'execute');
select has_function_privilege('automatisation.send_insert_users_newsletters()', 'execute');

ROLLBACK;
