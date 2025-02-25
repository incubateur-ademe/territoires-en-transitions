-- Deploy tet:indicateur/fusion to pg

BEGIN;

drop trigger modified_by on indicateur_valeur;

create function optional_enforce_modified_by()
    returns trigger
as
$$
begin
    if auth.uid() is not null then
        new.modified_by = auth.uid();
    end if;
    return new;
end;
$$ language plpgsql;

create trigger modified_by
    before insert or update
    on indicateur_valeur
    for each row
execute procedure optional_enforce_modified_by();

COMMIT;
