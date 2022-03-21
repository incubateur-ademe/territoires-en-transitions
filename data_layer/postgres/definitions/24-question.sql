create type question_type as enum ('choix', 'binaire', 'proportion');
create domain question_id as varchar(30);
create domain choix_id as varchar(30);


create table question_thematique
(
    id  varchar(30) primary key,
    nom text
);
comment on table question_thematique is
    'Question thematique';


create table question
(
    id            question_id primary key,
    thematique_id varchar references question_thematique,
    type          question_type not null,
    description   text          not null,
    formulation   text          not null
);
comment on table question is
    'Question asked to the user about a collectivité';


create table question_choix
(
    question_id question_id references question on delete cascade,
    id          choix_id primary key,
    formulation text
);
comment on table question_choix is
    'Question choix';


create table question_action
(
    question_id question_id references question on delete cascade,
    action_id   action_id references action_relation,
    primary key (question_id, action_id)
);
comment on table question_action is
    'Question <-> Action many-to-many relationship';


create or replace function business_upsert_questions(
    questions json[]
) returns void as
$$
declare
    obj  json;
    type question_type;
begin
    if true -- is_service_role()
    then
        -- loop over questions
        foreach obj in array questions
            loop
                type = obj ->> 'type';

                insert into question (id, thematique_id, type, description, formulation)
                values (obj ->> 'id',
                        obj ->> 'thematique_id',
                        (obj ->> 'type')::question_type,
                        obj ->> 'description',
                        obj ->> 'formulation')
                on conflict (id) do update
                    -- we update the request fields, except for type.
                    set thematique_id = excluded.thematique_id,
                        description = excluded.description,
                        formulation = excluded.formulation;

                with action_id as (
                    select a
                    from json_array_elements_text((obj ->> 'action_ids')::json) a
                )
                insert
                into question_action (question_id, action_id)
                select obj ->> 'id',
                       a::action_id
                from action_id r
                on conflict do nothing ;

                if type = 'choix'
                then
                    with choix as (
                        select c
                        from json_array_elements((obj ->> 'choix')::json) c
                    )
                    insert
                    into question_choix (question_id, id, formulation)
                    select obj ->> 'id',
                           c ->> 'id',
                           c ->> 'formulation'
                    from choix c
                    on conflict (id) do update
                        -- we update only formulation.
                        set formulation = excluded;
                end if;
            end loop;
    else
        perform set_config('response.status', '401', true);
    end if;
end
$$ language plpgsql;
