-- Revert tet:preuve_modify_by_with_api from pg

BEGIN;

CREATE OR REPLACE FUNCTION utilisateur.update_modified_by()
 RETURNS trigger
AS
$$
begin
    new.modified_by = auth.uid();
    return new;
end;
$$ language plpgsql;

COMMIT;
