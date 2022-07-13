-- Revert tet:utils/move_action_data from pg

BEGIN;

drop function private.move_action_data(a action_id, b action_id);

COMMIT;
