-- Verify tet:utils/automatisation on pg

BEGIN;

select uri_type, uri
from automatisation_uri
where false;

select has_function_privilege('send_users_json_n8n()', 'execute');
select has_function_privilege('send_collectivites_json_n8n()', 'execute');
select has_function_privilege('send_collectivite_membre_json_n8n()', 'execute');


ROLLBACK;
