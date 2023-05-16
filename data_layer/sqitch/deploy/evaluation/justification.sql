-- Deploy tet:evaluation/justification to pg

BEGIN;

create table justification
(
    collectivite_id integer                                              not null,
    question_id     question_id references question                      not null,
    modified_by     uuid references auth.users default auth.uid()        not null,
    texte           text                                                 not null,
    primary key (collectivite_id, question_id)
);
comment on table justification is 'Les justifications aux réponses aux questions de personnalisation.';

select private.add_modified_at_trigger('public', 'justification');
select private.add_modified_by_trigger('public', 'justification');

alter table justification
    enable row level security;

create policy allow_read
    on justification
    for select
    using (is_authenticated());

create policy allow_insert
    on justification
    for insert
    with check (have_edition_acces(collectivite_id));

create policy allow_update
    on justification
    for update
    using (have_edition_acces(collectivite_id));


create table historique.justification
(
    id                   serial primary key,
    collectivite_id      integer     not null,
    question_id          question_id not null,
    modified_by          uuid,
    previous_modified_by uuid,
    modified_at          timestamp with time zone,
    previous_modified_at timestamp with time zone,
    texte                text        not null,
    previous_texte       text
);

create function historique.save_justification() returns trigger
as
$$
declare
    updated integer;
begin
    -- debounce
    update historique.justification
    set texte       = new.texte,
        modified_at = new.modified_at
    where id in (select id
                 from historique.justification
                 where collectivite_id = new.collectivite_id
                   and question_id = new.question_id
                   and modified_by = new.modified_by
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_by desc
                 limit 1)
    returning id into updated;

    if updated is null
    then
        insert into historique.justification (collectivite_id,
                                              question_id,
                                              modified_by,
                                              previous_modified_by,
                                              modified_at,
                                              previous_modified_at,
                                              texte,
                                              previous_texte)
        values (new.collectivite_id,
                new.question_id,
                auth.uid(),
                old.modified_by,
                new.modified_at,
                old.modified_at,
                new.texte,
                old.texte);
    end if;
    return new;
end ;
$$ language plpgsql security definer;

create trigger save_history
    after insert or update
    on justification
    for each row
execute procedure historique.save_justification();

COMMIT;
