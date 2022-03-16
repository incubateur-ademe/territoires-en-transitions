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
alter table question_thematique
    enable row level security;
create policy allow_read_for_all on question_thematique for select using (true);


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

alter table question
    enable row level security;
create policy allow_read_for_all on question for select using (true);

create table question_choix
(
    question_id question_id references question on delete cascade,
    id          choix_id primary key,
    formulation text
);
comment on table question_choix is
    'Question choix';

alter table question_choix
    enable row level security;
create policy allow_read_for_all on question_choix for select using (true);


create table question_action
(
    question_id question_id references question on delete cascade,
    action_id   action_id references action_relation,
    primary key (question_id, action_id)
);
comment on table question_action is
    'Question <-> Action many-to-many relationship';

alter table question_action
    enable row level security;
create policy allow_read_for_all on question_action for select using (true);


create or replace function business_upsert_questions(
    questions json[]
) returns void as
$$
declare
    obj  json;
    type question_type;
begin
    if is_service_role() -- only service role can upsert questions
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
                        description   = excluded.description,
                        formulation   = excluded.formulation;

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

create view question_display
as
with actions as (
    select question_id, array_agg(action_id) action_ids
    from question_action
    group by question_id
)
select q.id    as id,
       a.action_ids,
       thematique_id,
       type,
       t.nom   as thematique_nom,
       description,
       formulation,
       cx.json as choix
from question q
         join question_thematique t on t.id = q.thematique_id
         join actions a on q.id = a.question_id
         left join lateral (
    select json_build_array(
                   json_build_object('id', c.id,
                                     'label', c.formulation)
               ) as json
    from question_choix c
    where c.question_id = q.id) cx on true
;
