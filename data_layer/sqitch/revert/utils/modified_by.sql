-- Revert tet:utils/modified_by from pg

BEGIN;

drop function enforce_modified_by;
drop function private.add_modified_by_trigger;

COMMIT;
