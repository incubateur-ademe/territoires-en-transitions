-- Deploy tet:referentiel/action_pilote to pg

BEGIN;

create table action_pilote
(
    collectivite_id     integer references collectivite         ON DELETE CASCADE not null,
    action_id           action_id references action_relation    ON DELETE CASCADE not null,
    user_id             uuid references auth.users              ON DELETE CASCADE,
    tag_id              integer references personne_tag         ON DELETE CASCADE,

    primary key (collectivite_id, action_id),
    CONSTRAINT either_user_or_tag_not_null CHECK (user_id IS NOT NULL OR tag_id IS NOT NULL)

);
comment on table action_pilote is 'In référentiel, we keep "action" as a technical name, but use "mesure" in the UI.';

create policy allow_read
    on action_pilote
    using (can_read_acces_restreint(collectivite_id));

create policy allow_insert
    on action_pilote
    for insert with check(have_edition_acces(collectivite_id));

create policy allow_update
    on action_pilote
    for update using(have_edition_acces(collectivite_id));

create policy allow_delete
    on action_pilote
    for delete using(have_edition_acces(collectivite_id));

COMMIT;
