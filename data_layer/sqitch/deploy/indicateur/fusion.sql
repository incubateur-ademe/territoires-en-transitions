-- Deploy tet:indicateur/fusion to pg

BEGIN;

-- creation de l'unicité basé sur la source et la date de version pour l'instant
-- A voir si plus tard, on ajoute d'autres champs
create unique index unique_indicateur_source_metadonnee
    on public.indicateur_source_metadonnee (source_id, date_version);

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
