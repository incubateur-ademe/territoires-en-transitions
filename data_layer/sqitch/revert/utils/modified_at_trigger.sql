-- Revert tet:utils/modified_at_trigger from pg

BEGIN;

drop function private.add_modified_at_trigger(text, text);

COMMIT;
