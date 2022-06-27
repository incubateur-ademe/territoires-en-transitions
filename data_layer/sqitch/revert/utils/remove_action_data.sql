-- Revert tet:utils/remove_action_data from pg

BEGIN;

drop function private.remove_action_data(a action_id);

COMMIT;
