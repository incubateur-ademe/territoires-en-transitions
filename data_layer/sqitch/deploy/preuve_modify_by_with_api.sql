-- Deploy tet:preuve_modify_by_with_api to pg

BEGIN;

CREATE OR REPLACE FUNCTION utilisateur.update_modified_by()
 RETURNS trigger
AS
$$
begin
    new.modified_by = COALESCE(auth.uid(), new.modified_by);
    return new;
end;
$$ language plpgsql;

COMMIT;
