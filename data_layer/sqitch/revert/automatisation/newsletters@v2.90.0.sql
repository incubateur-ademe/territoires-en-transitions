-- Revert tet:automatisation/newsletters from pg

BEGIN;

drop trigger dcp_insert_newsletters on dcp;
drop function automatisation.send_insert_users_newsletters;
drop function automatisation.send_pa_users_newsletters;
drop table automatisation.supabase_function_url;

COMMIT;
