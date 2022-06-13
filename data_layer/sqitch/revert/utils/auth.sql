-- Revert tet:utils/auth from pg

BEGIN;

drop function is_authenticated;
drop function is_service_role;

COMMIT;
