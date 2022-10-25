-- Revert tet:referentiel/action_definition from pg

BEGIN;

drop table referentiel_json;
drop function private.upsert_actions(definitions jsonb, children jsonb);
drop function private.upsert_referentiel_after_json_insert();

COMMIT;
