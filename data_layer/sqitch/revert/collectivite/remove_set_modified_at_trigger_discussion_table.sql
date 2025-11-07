-- Revert tet:collectivite/remove_set_modified_at_trigger_discussion_table from pg

BEGIN;

create trigger set_modified_at before
update
    on
    public.discussion for each row execute function update_modified_at();

COMMIT;
