-- Deploy tet:evaluation/contenu_json to pg

BEGIN;

create or replace function private.upsert_regles(
    regles jsonb[]
) returns void as
$$
declare
    regle json;
begin
    -- loop over règles
    foreach regle in array regles
        loop

            with regle as (select r
                           from json_array_elements((regle ->> 'regles')::json) r)
            insert
            into personnalisation_regle (action_id, type, formule, description)
            select regle ->> 'action_id',
                   (r ->> 'type')::regle_type,
                   r ->> 'formule',
                   r ->> 'description'
            from regle r
            on conflict (action_id, type) do update
                set formule     = excluded.formule,
                    description = excluded.description;
        end loop;
end
$$ language plpgsql security definer;

COMMIT;
