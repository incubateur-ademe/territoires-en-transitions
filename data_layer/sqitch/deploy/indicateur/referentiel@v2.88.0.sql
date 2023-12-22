-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;


create table indicateur_pilote
(
    indicateur_id indicateur_id not null references indicateur_definition,
    collectivite_id integer not null references collectivite,
    user_id  uuid references auth.users,
    tag_id   integer references personne_tag on delete cascade,
    unique (indicateur_id, collectivite_id, user_id, tag_id)
);
alter table indicateur_pilote enable row level security;
create policy allow_insert on indicateur_pilote
    for insert with check (have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_read on indicateur_pilote
    for select using (can_read_acces_restreint(collectivite_id));
create policy allow_update on indicateur_pilote
    for update using (have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_delete on indicateur_pilote
    for delete using (have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));


create table indicateur_service_tag
(
    indicateur_id       indicateur_id not null references indicateur_definition,
    collectivite_id integer not null references collectivite,
    service_tag_id integer not null references service_tag on delete cascade,
    primary key (indicateur_id, collectivite_id, service_tag_id)
);
alter table indicateur_service_tag enable row level security;
create policy allow_insert on indicateur_service_tag
    for insert with check (have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_read on indicateur_service_tag
    for select using (can_read_acces_restreint(collectivite_id));
create policy allow_update on indicateur_service_tag
    for update using (have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_delete on indicateur_service_tag
    for delete using (have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));



COMMIT;
