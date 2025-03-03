-- Deploy tet:referentiel/action_service to pg

BEGIN;

create table action_service
(
    collectivite_id     integer references collectivite         ON DELETE CASCADE not null,
    action_id           action_id references action_relation    ON DELETE CASCADE not null,
    service_tag_id      integer references service_tag          ON DELETE CASCADE not null,

    primary key (collectivite_id, action_id)
);
comment on table action_service is 'In référentiel, we keep "action" as a technical name, but use "mesure" in the UI.';

create policy allow_read
    on action_service
    using (can_read_acces_restreint(collectivite_id));

create policy allow_insert
    on action_service
    for insert with check(have_edition_acces(collectivite_id));

create policy allow_update
    on action_service
    for update using(have_edition_acces(collectivite_id));

create policy allow_delete
    on action_service
    for delete using(have_edition_acces(collectivite_id));

COMMIT;

