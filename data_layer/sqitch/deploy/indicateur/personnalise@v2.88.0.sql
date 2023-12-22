-- Deploy tet:indicateur/personnalise to pg

BEGIN;

create function private.indicateur_personnalise_collectivite_id(indicateur_id integer)
    returns integer
    stable
    security definer
begin
    atomic
    select collectivite_id
    from indicateur_personnalise_definition
    where id = indicateur_id;
end;
comment on function private.indicateur_personnalise_collectivite_id
    is 'Renvoie la collectivité d''un indicateur à partir de son id';


create table indicateur_personnalise_pilote
(
    indicateur_id integer not null references indicateur_personnalise_definition,
    user_id       uuid references auth.users,
    tag_id        integer references personne_tag on delete cascade,
    unique (indicateur_id, user_id, tag_id)
);
alter table indicateur_personnalise_pilote
    enable row level security;
create policy allow_insert on indicateur_personnalise_pilote
    for insert
    with check (have_edition_acces(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
                ));
create policy allow_read on indicateur_personnalise_pilote
    for select
    using (can_read_acces_restreint(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
           ));
create policy allow_update on indicateur_personnalise_pilote
    for update
    using (have_edition_acces(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
           ));
create policy allow_delete on indicateur_personnalise_pilote
    for delete
    using (have_edition_acces(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
           ));


create table indicateur_personnalise_service_tag
(
    indicateur_id  integer not null references indicateur_personnalise_definition,
    service_tag_id integer not null references service_tag on delete cascade,
    primary key (indicateur_id, service_tag_id)
);
alter table indicateur_personnalise_service_tag
    enable row level security;
create policy allow_insert on indicateur_personnalise_service_tag
    for insert
    with check (have_edition_acces(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
                ));
create policy allow_read on indicateur_personnalise_service_tag
    for select
    using (can_read_acces_restreint(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
           ));
create policy allow_update on indicateur_personnalise_service_tag
    for update
    using (have_edition_acces(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
           ));
create policy allow_delete on indicateur_personnalise_service_tag
    for delete
    using (have_edition_acces(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
           ));


create table indicateur_personnalise_thematique
(
    indicateur_id integer references indicateur_personnalise_definition not null,
    thematique_id integer references thematique not null,
    primary key (indicateur_id, thematique_id)
);
alter table indicateur_personnalise_thematique enable row level security;
create policy allow_insert on indicateur_personnalise_thematique
    for insert
    with check (have_edition_acces(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
                ));
create policy allow_read on indicateur_personnalise_thematique
    for select
    using (can_read_acces_restreint(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
           ));
create policy allow_update on indicateur_personnalise_thematique
    for update
    using (have_edition_acces(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
           ));
create policy allow_delete on indicateur_personnalise_thematique
    for delete
    using (have_edition_acces(
        private.indicateur_personnalise_collectivite_id(indicateur_id)
           ));

COMMIT;
