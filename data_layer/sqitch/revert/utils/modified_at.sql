-- Revert tet:utils/modified_at from pg

BEGIN;

drop table abstract_modified_at;
drop function update_modified_at;

COMMIT;
