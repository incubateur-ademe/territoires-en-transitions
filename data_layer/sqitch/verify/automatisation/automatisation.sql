-- Verify tet:utils/automatisation on pg

BEGIN;

select uri_type, uri
from automatisation.automatisation_uri
where false;

select has_function_privilege('automatisation.send_insert_users_json_n8n()', 'execute');
select has_function_privilege('automatisation.send_upsert_users_json_n8n()', 'execute');
select has_function_privilege('automatisation.send_upsert_collectivites_json_n8n(interval)', 'execute');
select has_function_privilege('automatisation.send_upsert_collectivite_membre_json_n8n()', 'execute');


ROLLBACK;
