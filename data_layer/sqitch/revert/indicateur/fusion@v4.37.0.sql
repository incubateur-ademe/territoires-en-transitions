-- Deploy tet:indicateur/fusion to pg

BEGIN;

drop trigger modified_by on indicateur_valeur;

drop function public.optional_enforce_modified_by;

create trigger modified_by
    before insert or update
    on indicateur_valeur
    for each row
execute procedure enforce_modified_by();


COMMIT;
