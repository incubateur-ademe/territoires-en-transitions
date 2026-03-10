-- Revert tet:evaluation/drop-justification-triggers from pg

BEGIN;

create trigger modified_at before
insert
    or
update
    on
    public.justification for each row execute function update_modified_at();

create trigger modified_by before
insert
    or
update
    on
    public.justification for each row execute function enforce_modified_by();

COMMIT;
