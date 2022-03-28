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


create type type_collectivite as enum ('EPCI', 'commune');

create table question
(
    id                             question_id primary key,
    thematique_id                  varchar references question_thematique,
    ordonnancement                 integer,
    types_collectivites_concernees type_collectivite[],
    type                           question_type       not null,
    description                    text                not null,
    formulation                    text                not null
);
comment on table question is
    'Question a propos des caractéristiques de la collectivités, afin de personnaliser la notation des référentiels';

alter table question
    enable row level security;
create policy allow_read_for_all on question for select using (true);

create table question_choix
(
    question_id    question_id references question on delete cascade,
    id             choix_id primary key,
    ordonnancement integer,
    formulation    text
);
comment on table question_choix is
    'Options de réponse aux question de type choix';

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


create view question_thematique_display as
with qt as (
    select action_id, thematique_id
    from question_action qa
        join question q on qa.question_id = q.id
), qr as (
    select thematique_id, array_agg(referentiel) as referentiels
    from qt
        join action_relation r on r.id = qt.action_id
    group by thematique_id
)
select t.id, t.nom, referentiels
from question_thematique t
    left join qr on qr.thematique_id = t.id ;

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

                insert into question (id, thematique_id, type, description, ordonnancement, formulation,
                                      types_collectivites_concernees)
                values (obj ->> 'id',
                        obj ->> 'thematique_id',
                        (obj ->> 'type')::question_type,
                        obj ->> 'description',
                        (obj ->> 'ordonnancement')::integer,
                        obj ->> 'formulation',
                        array(select json_array_elements_text(obj -> 'types_collectivites_concernees')
                                         ::type_collectivite))
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


create view question_engine
as
select q.id   as id,
       type,
       cx.ids as choix_ids
from question q
         left join lateral (select array_agg(c.id) as ids
                            from question_choix c
                            where c.question_id = q.id) cx on true;
comment on view question_engine is
    'Questions avec leurs choix pour le moteur de formule -- not used';
