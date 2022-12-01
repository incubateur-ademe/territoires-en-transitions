-- Deploy tet:referentiel/action_definition to pg

BEGIN;


-- version précédente du trigger
create or replace function
    private.upsert_referentiel_after_json_insert()
    returns trigger
as
$$
declare
begin
    perform private.upsert_actions(new.definitions, new.children);
    return new;
end;
$$ language plpgsql;

COMMIT;
