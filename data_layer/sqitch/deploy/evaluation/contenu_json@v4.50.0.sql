-- Deploy tet:evaluation/contenu_json to pg

BEGIN;

create or replace function private.upsert_questions(
    questions jsonb[]
) returns void as
$$
declare
    obj                  json;
    type                 question_type;
    types_concernes_null boolean;
    types_concernes_arr  text[];
begin
    -- loop over questions
    foreach obj in array questions
        loop
            type = obj ->> 'type';
            select (obj ->> 'types_collectivites_concernees') is null into types_concernes_null;

            if types_concernes_null
            then
                select null into types_concernes_arr;
            else
                select array(select json_array_elements_text((obj -> 'types_collectivites_concernees')))
                into
                    types_concernes_arr;
            end if;

            insert into question (id, thematique_id, type, description, ordonnancement, formulation,
                                  types_collectivites_concernees)
            values (obj ->> 'id',
                    obj ->> 'thematique_id',
                    (obj ->> 'type')::question_type,
                    obj ->> 'description',
                    (obj ->> 'ordonnancement')::integer,
                    obj ->> 'formulation',
                    types_concernes_arr)
            on conflict (id) do update
                -- we update the request fields, except for type.
                set thematique_id                  = excluded.thematique_id,
                    description                    = excluded.description,
                    formulation                    = excluded.formulation,
                    ordonnancement                 = excluded.ordonnancement,
                    types_collectivites_concernees = excluded.types_collectivites_concernees;

            with action_id as (select a
                               from json_array_elements_text((obj ->> 'action_ids')::json) a)
            insert
            into question_action (question_id, action_id)
            select obj ->> 'id',
                   a::action_id
            from action_id r
            on conflict do nothing;

            if type = 'choix'
            then
                with choix as (select c
                               from json_array_elements((obj ->> 'choix')::json) c)
                insert
                into question_choix (question_id, id, formulation, ordonnancement)
                select obj ->> 'id',
                       c ->> 'id',
                       c ->> 'formulation',
                       (c ->> 'ordonnancement')::integer
                from choix c
                on conflict (id) do update
                    -- we update only formulation and ordonnancement
                    set formulation    = excluded.formulation,
                        ordonnancement = excluded.ordonnancement;
            end if;
        end loop;
end
$$ language plpgsql security definer;

COMMIT;
