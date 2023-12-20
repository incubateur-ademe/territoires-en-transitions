-- Deploy tet:indicateur/detail to pg

BEGIN;

drop trigger rewrite_indicateur_id on indicateur_pilote;
drop trigger rewrite_indicateur_id on indicateur_service_tag;
drop trigger rewrite_indicateur_id on fiche_action_indicateur;

drop function private.get_personne(indicateur_pilote);

drop policy allow_insert on indicateur_pilote;
drop policy allow_read on indicateur_pilote;
drop policy allow_update on indicateur_pilote;
drop policy allow_delete on indicateur_pilote;
drop function private.can_write(indicateur_pilote);
drop function private.can_read(indicateur_pilote);
drop table indicateur_pilote;
create table indicateur_pilote
(
    indicateur_id   indicateur_id not null
        references indicateur_definition,
    collectivite_id integer       not null
        references collectivite,
    user_id         uuid
        references auth.users,
    tag_id          integer
        references personne_tag
            on delete cascade,
    constraint indicateur_pilote_indicateur_id_collectivite_id_user_id_tag_key
        unique (indicateur_id, collectivite_id, user_id, tag_id)
);
alter table indicateur_pilote
    enable row level security;
create policy allow_insert on indicateur_pilote
    for insert with check (have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_read on indicateur_pilote
    for select using (can_read_acces_restreint(collectivite_id));
create policy allow_update on indicateur_pilote
    for update using (have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_delete on indicateur_pilote
    for delete using (have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));

create table indicateur_personnalise_pilote
(
    indicateur_id integer not null
        references indicateur_personnalise_definition,
    user_id       uuid
        references auth.users,
    tag_id        integer
        references personne_tag
            on delete cascade,
    unique (indicateur_id, user_id, tag_id)
);


insert into indicateur_personnalise_pilote
    table migration.indicateur_personnalise_pilote;

insert into indicateur_pilote
    table migration.indicateur_pilote;


drop policy allow_insert on indicateur_service_tag;
drop policy allow_read on indicateur_service_tag;
drop policy allow_update on indicateur_service_tag;
drop policy allow_delete on indicateur_service_tag;
drop function private.can_write(indicateur_service_tag);
drop function private.can_read(indicateur_service_tag);
drop table indicateur_service_tag;

create table indicateur_service_tag
(
    indicateur_id   indicateur_id not null
        references indicateur_definition,
    collectivite_id integer       not null
        references collectivite,
    service_tag_id  integer       not null
        references service_tag
            on delete cascade,
    primary key (indicateur_id, collectivite_id, service_tag_id)
);

create table indicateur_personnalise_service_tag
(
    indicateur_id  integer not null
        references indicateur_personnalise_definition,
    service_tag_id integer not null
        references service_tag
            on delete cascade,
    primary key (indicateur_id, service_tag_id)
);


create function
    services(indicateur_definitions)
    returns setof service_tag[]
    rows 1
begin
    atomic
    select coalesce(
                   (select case
                               when $1.indicateur_id is not null -- indicateur prédéfini
                                   then
                                   (select array_agg(st)
                                    from indicateur_service_tag ist
                                             join service_tag st on ist.service_tag_id = st.id
                                    where ist.collectivite_id = $1.collectivite_id
                                      and ist.indicateur_id = $1.indicateur_id)
                               else -- indicateur personnalisé
                                   (select array_agg(st)
                                    from indicateur_personnalise_service_tag ist
                                             join service_tag st on ist.service_tag_id = st.id
                                    where ist.indicateur_id = $1.indicateur_perso_id)
                               end),
                   '{}'::service_tag[]
           );
end;
comment on function services is
    'La liste de services pilotes rattachés à un indicateur.';

create function
    private.get_personne(indicateur_pilote)
    returns personne
    security definer
begin
    atomic
    select case
               when $1.tag_id is not null
                   then (select row (pt.nom, pt.collectivite_id, $1.tag_id, null::uuid)::personne
                         from personne_tag pt
                         where pt.id = $1.tag_id)
               else (select row (u.prenom || ' ' || u.nom, $1.collectivite_id, null::integer, u.user_id)::personne
                     from utilisateur.dcp_display u
                     where u.user_id = $1.user_id)
               end;
end;
comment on function private.get_personne(indicateur_pilote) is
    'Renvoie la personne pilote d''un indicateur.';


create function
    private.get_personne(indicateur_personnalise_pilote)
    returns personne
    security definer
begin
    atomic
    select case
               when $1.tag_id is not null
                   then (select (select row (pt.nom, pt.collectivite_id, $1.tag_id, null::uuid)::personne
                                 from personne_tag pt
                                 where pt.id = $1.tag_id))
               else (select row (u.prenom || ' ' || u.nom,
                                (select collectivite_id
                                 from indicateur_personnalise_definition d
                                 where d.id = $1.indicateur_id),
                                null::integer,
                                u.user_id)::personne
                     from utilisateur.dcp_display u
                     where u.user_id = $1.user_id)
               end;
end;
comment on function private.get_personne(indicateur_personnalise_pilote) is
    'Renvoie la personne pilote d''un indicateur personnalisé.';

create function
    pilotes(indicateur_definitions)
    returns setof personne[]
    rows 1
begin
    atomic
    select coalesce(
                   (select case
                               when $1.indicateur_id is not null -- indicateur prédéfini
                                   then
                                   (select array_agg(private.get_personne(pilote))
                                    from indicateur_pilote pilote
                                    where pilote.collectivite_id = $1.collectivite_id
                                      and pilote.indicateur_id = $1.indicateur_id)
                               else -- indicateur personnalisé
                                   (select array_agg(private.get_personne(pilote))
                                    from indicateur_personnalise_pilote pilote
                                    where pilote.indicateur_id = $1.indicateur_perso_id)
                               end),
                   '{}'::personne[]
           );
end;
comment on function pilotes is
    'La liste des personnes pilotes pour un indicateur.';

create or replace function
    thematiques(indicateur_definitions)
    returns setof thematique[]
    rows 1
begin
    atomic
    select coalesce(
                   (select case
                               when $1.indicateur_id is not null -- indicateur prédéfini
                                   then
                                   (select array_agg(thematique)
                                    from indicateur_definition definition
                                             join thematique
                                                  on thematique.md_id = any (definition.thematiques)
                                    where definition.id = $1.indicateur_id)
                               else -- indicateur personnalisé
                                   (select array_agg(thematique)
                                    from indicateur_personnalise_definition definition
                                             join indicateur_personnalise_thematique it
                                                  on definition.id = it.indicateur_id
                                             join thematique on it.thematique_id = thematique.id
                                    where definition.id = $1.indicateur_perso_id)
                               end),
                   '{}'::thematique[]
           );
end;
comment on function thematiques is
    'La listes des thématiques d''un indicateur.';

COMMIT;
