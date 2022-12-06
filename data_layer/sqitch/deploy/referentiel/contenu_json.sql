-- Deploy tet:referentiel/action_definition to pg

BEGIN;

-- Trigger pour mettre à jour le contenu suite à l'insertion de json.
create or replace function
    private.upsert_referentiel_after_json_insert()
    returns trigger
as
$$
declare
begin
    perform private.upsert_actions(new.definitions, new.children);
    refresh materialized view evaluation.service_referentiel;
    refresh materialized view private.action_node;
    refresh materialized view action_referentiel;
    return new;
end;
$$ language plpgsql security definer;

COMMIT;
