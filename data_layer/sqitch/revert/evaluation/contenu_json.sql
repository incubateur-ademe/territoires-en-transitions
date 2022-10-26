-- Revert tet:evaluation/contenu_json from pg

BEGIN;

-- drop feature
drop trigger upsert_personnalisations on personnalisations_json;
drop function private.upsert_personnalisations_after_json_insert();
drop function private.upsert_regles(regles jsonb[]);
drop function private.upsert_questions(questions jsonb[]);
drop table personnalisations_json;

-- restore previous functions
create or replace function business_upsert_questions(
    questions json[]
) returns void as
$$
declare
    obj  json;
    type question_type;
    types_concernes_null boolean;
    types_concernes_arr type_collectivite[];
begin
    if is_service_role() -- only service role can upsert questions
    then
        -- loop over questions
        foreach obj in array questions
            loop
                type = obj ->> 'type';

                select (obj ->> 'types_collectivites_concernees') is null into types_concernes_null;
                -- select obj -> 'types_collectivites_concernees' into types_concernes_js ;

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
                        types_concernes_arr
                       )
                on conflict (id) do update
                    -- we update the request fields, except for type.
                    set thematique_id                  = excluded.thematique_id,
                        description                    = excluded.description,
                        formulation                    = excluded.formulation,
                        ordonnancement                 = excluded.ordonnancement,
                        types_collectivites_concernees = excluded.types_collectivites_concernees;

                with action_id as (
                    select a
                    from json_array_elements_text((obj ->> 'action_ids')::json) a
                )
                insert
                into question_action (question_id, action_id)
                select obj ->> 'id',
                       a::action_id
                from action_id r
                on conflict do nothing;

                if type = 'choix'
                then
                    with choix as (
                        select c
                        from json_array_elements((obj ->> 'choix')::json) c
                    )
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
    else
        perform set_config('response.status', '401', true);
    end if;
end
$$ language plpgsql;


create or replace function business_upsert_personnalisations(
    personnalisations json[]
) returns void as
$$
declare
    obj json;
begin
    if is_service_role()
    then
        -- loop over personnalisations
        foreach obj in array personnalisations
            loop

                insert into personnalisation (action_id, titre, description)
                values (obj ->> 'action_id',
                        obj ->> 'titre',
                        obj ->> 'description')
                on conflict (action_id) do update
                    set titre       = excluded.titre,
                        description = excluded.description;

                with regle as (
                    select r
                    from json_array_elements((obj ->> 'regles')::json) r
                )
                insert
                into personnalisation_regle (action_id, type, formule, description)
                select obj ->> 'action_id',
                       (r ->> 'type')::regle_type,
                       r ->> 'formule',
                       r ->> 'description'
                from regle r
                on conflict (action_id, type) do update
                    set formule     = excluded.formule,
                        description = excluded.description;
            end loop;
    else
        perform set_config('response.status', '401', true);
    end if;
end
$$ language plpgsql security definer;

create or replace function
    business_replace_personnalisations(personnalisations json[])
    returns void
as
$$
begin
    if is_service_role() then
        truncate personnalisation cascade;
        truncate personnalisation_regle;
        perform business_upsert_personnalisations(personnalisations);
    else
        perform set_config('response.status', '401', true);
    end if;
end;
$$ language plpgsql;
comment on function business_replace_personnalisations is
    'Remplace les règles de personnalisation.';

COMMIT;
