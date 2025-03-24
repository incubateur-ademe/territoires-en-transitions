-- Deploy tet:referentiel/justification_ajustement to pg

BEGIN;

create table justification_ajustement
(
    collectivite_id integer references collectivite               not null,
    action_id       action_id references action_relation          not null,
    texte           text                                          not null,
    modified_by     uuid references auth.users default auth.uid() not null,
    modified_at     timestamp with time zone                      not null,
    primary key (collectivite_id, action_id)
);
comment on table justification_ajustement is 'Les justifications pour les scores ajustés.';

select private.add_modified_at_trigger('public', 'justification_ajustement');
select private.add_modified_by_trigger('public', 'justification_ajustement');

alter table justification_ajustement
    enable row level security;

create policy allow_read
    on justification_ajustement
    for select
    using (est_verifie() or have_lecture_acces(collectivite_id));

create policy allow_insert
    on justification_ajustement
    for insert
    with check (have_edition_acces(collectivite_id) OR est_auditeur_action(collectivite_id, action_id));

create policy allow_update
    on justification_ajustement
    for update
    using (have_edition_acces(collectivite_id) OR est_auditeur_action(collectivite_id, action_id));


create table historique.justification_ajustement
(
    id                   serial primary key,
    collectivite_id      integer   not null,
    action_id            action_id not null,
    modified_by          uuid,
    previous_modified_by uuid,
    modified_at          timestamp with time zone,
    previous_modified_at timestamp with time zone,
    texte                text      not null,
    previous_texte       text
);

create function historique.save_justification_ajustement() returns trigger
as
$$
declare
    updated integer;
begin
    -- debounce
    update historique.justification_ajustement
    set texte       = new.texte,
        modified_at = new.modified_at
    where id in (select id
                 from historique.justification_ajustement
                 where collectivite_id = new.collectivite_id
                   and action_id = new.action_id
                   and modified_by = new.modified_by
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_by desc
                 limit 1)
    returning id into updated;

    if updated is null
    then
        insert into historique.justification_ajustement (collectivite_id,
                                                         action_id,
                                                         modified_by,
                                                         previous_modified_by,
                                                         modified_at,
                                                         previous_modified_at,
                                                         texte,
                                                         previous_texte)
        values (new.collectivite_id,
                new.action_id,
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
    on justification_ajustement
    for each row
execute procedure historique.save_justification_ajustement();

COMMIT;
