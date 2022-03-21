create table reponse_choix
(
    collectivite_id integer references collectivite    not null,
    question_id     question_id references question    not null,
    reponse         choix_id references question_choix not null,
    primary key (collectivite_id, question_id)
);
comment on table reponse_choix is
    'Réponses saisies par la collectivité aux questions de type choix';


create table reponse_binaire
(
    collectivite_id integer references collectivite not null,
    question_id     question_id references question not null,
    reponse         boolean                         not null,
    primary key (collectivite_id, question_id)
);
comment on table reponse_choix is
    'Réponses saisies par la collectivité aux questions de type binaire';

create table reponse_proportion
(
    collectivite_id integer references collectivite not null,
    question_id     question_id references question not null,
    reponse         double precision                not null,
    primary key (collectivite_id, question_id)
);
comment on table reponse_choix is
    'Réponses saisies par la collectivité aux questions de type proportion';


create or replace view reponse_display
as
select q.id                                                                 as question_id,
       coalesce(rb.collectivite_id, rp.collectivite_id, rc.collectivite_id) as collectivite_id,
       case
           when q.type = 'binaire'
               then json_build_object('question_id', q.id,
                                      'collectivite_id', rb.collectivite_id,
                                      'type', q.type,
                                      'reponse', rb.reponse)
           when q.type = 'proportion'
               then json_build_object('question_id', q.id,
                                      'collectivite_id', rp.collectivite_id,
                                      'type', q.type,
                                      'reponse', rp.reponse)
           when q.type = 'choix'
               then json_build_object('question_id', q.id,
                                      'collectivite_id', rc.collectivite_id,
                                      'type', q.type,
                                      'reponse', rc.reponse)
           end
                                                                            as reponse
from question q
         left join reponse_binaire rb on rb.question_id = q.id
         left join reponse_proportion rp on rp.question_id = q.id
         left join reponse_choix rc on rc.question_id = q.id
where is_any_role_on(coalesce(rb.collectivite_id, rp.collectivite_id, rc.collectivite_id));


create or replace function save_reponse(json)
    returns void
as
$$
declare
    qt                  question_type;
    arg_question_id     question_id;
    arg_collectivite_id integer;
    arg_reponse         text;
begin
    select $1 ->> 'question_id' into arg_question_id;
    select $1 ->> 'collectivite_id' into arg_collectivite_id;
    select $1 ->> 'reponse' into arg_reponse;

    select type
    into qt
    from question
    where id = arg_question_id;

    if qt = 'binaire'
    then
        insert into reponse_binaire (collectivite_id, question_id, reponse)
        select arg_collectivite_id, arg_question_id, arg_reponse::boolean
        on conflict (collectivite_id, question_id) do update
            set reponse = arg_reponse::boolean;
    elsif qt = 'proportion'
    then
        insert into reponse_proportion(collectivite_id, question_id, reponse)
        select arg_collectivite_id, arg_question_id, arg_reponse::double precision
        on conflict (collectivite_id, question_id) do update
            set reponse = arg_reponse::double precision;
    elsif qt = 'choix'
    then
        insert into reponse_choix(collectivite_id, question_id, reponse)
        select arg_collectivite_id, arg_question_id, arg_reponse::choix_id
        on conflict (collectivite_id, question_id) do update
            set reponse = arg_reponse::choix_id;
    end if;
end
$$ language plpgsql;

-- Row level SECURITY
alter table reponse_choix
    enable row level security;

create policy allow_read
    on reponse_choix
    for select
    using (is_authenticated());

create policy allow_insert
    on reponse_choix
    for insert
    with check (is_any_role_on(collectivite_id));

create policy allow_update
    on reponse_choix
    for update
    using (is_any_role_on(collectivite_id));
--
alter table reponse_binaire
    enable row level security;

create policy allow_read
    on reponse_binaire
    for select
    using (is_authenticated());

create policy allow_insert
    on reponse_binaire
    for insert
    with check (is_any_role_on(collectivite_id));

create policy allow_update
    on reponse_binaire
    for update
    using (is_any_role_on(collectivite_id));

--
alter table reponse_proportion
    enable row level security;

create policy allow_read
    on reponse_proportion
    for select
    using (is_authenticated());

create policy allow_insert
    on reponse_proportion
    for insert
    with check (is_any_role_on(collectivite_id));

create policy allow_update
    on reponse_proportion
    for update
    using (is_any_role_on(collectivite_id));
