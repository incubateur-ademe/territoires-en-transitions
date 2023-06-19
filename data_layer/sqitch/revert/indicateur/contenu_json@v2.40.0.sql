-- Revert tet:indicateur/json_content from pg

BEGIN;

drop trigger after_indicateurs_json on indicateurs_json;
drop function private.upsert_indicateurs_after_json_insert();
drop function private.upsert_indicateurs(indicateurs jsonb);
drop table indicateurs_json;

COMMIT;
