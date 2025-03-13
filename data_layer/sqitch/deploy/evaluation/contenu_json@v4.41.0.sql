-- Deploy tet:evaluation/contenu_json to pg

BEGIN;

-- drop previous functions.
drop function business_upsert_questions(questions json[]);
drop function business_replace_personnalisations(personnalisations json[]);
drop function business_upsert_personnalisations(personnalisations json[]);

create table personnalisations_json
(
    questions  jsonb       not null,
    regles     jsonb       not null,
    created_at timestamptz not null default now()
);
alter table personnalisations_json
    enable row level security;


create function private.upsert_questions(
    questions jsonb[]
) returns void as
$$
declare
    obj                  json;
    type                 question_type;
    types_concernes_null boolean;
    types_concernes_arr  type_collectivite[];
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


create function private.upsert_regles(
    regles jsonb[]
) returns void as
$$
declare
    regle json;
begin
    -- loop over règles
    foreach regle in array regles
        loop

            insert into personnalisation (action_id, titre, description)
            values (regle ->> 'action_id',
                    regle ->> 'titre',
                    regle ->> 'description')
            on conflict (action_id) do update
                set titre       = excluded.titre,
                    description = excluded.description;

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


-- Trigger pour mettre à jour le contenu suite à l'insertion de json.
create function
    private.upsert_personnalisations_after_json_insert()
    returns trigger
as
$$
begin
    -- Ouvre le json pour extraire la liste de règles
    perform private.upsert_regles(array_agg(r))
    from jsonb_array_elements(new.regles) r;

    -- Ouvre le json pour extraire la liste de questions
    perform private.upsert_questions(array_agg(q))
    from jsonb_array_elements(new.questions) q;

    return new;
end;
$$ language plpgsql;

create trigger upsert_personnalisations
    after insert
    on personnalisations_json
    for each row
execute procedure private.upsert_personnalisations_after_json_insert();

COMMIT;
