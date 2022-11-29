-- Revert tet:utils/automatisation from pg

BEGIN;

drop trigger dcp_upsert on dcp;
drop function send_users_json_n8n;
drop view users_crm;

COMMIT;
