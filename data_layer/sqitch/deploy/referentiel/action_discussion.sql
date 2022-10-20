-- Deploy tet:referentiel/action_discussion to pg

BEGIN;

create type action_discussion_statut as enum ('ouvert', 'ferme');

create table action_discussion
(
    id              serial primary key,
    collectivite_id integer references collectivite                      not null,
    action_id       action_id references action_relation                 not null,
    created_by      uuid references auth.users default auth.uid()        not null,
    created_at      timestamp with time zone   default CURRENT_TIMESTAMP not null,
    modified_at     timestamp with time zone   default CURRENT_TIMESTAMP not null,
    status          action_discussion_statut   default 'ouvert'          not null
);

create trigger set_modified_at
    before update
    on action_discussion
    for each row
execute procedure update_modified_at();

create table action_discussion_commentaire
(
    id            serial primary key,
    created_by    uuid references auth.users default auth.uid()        not null,
    created_at    timestamp with time zone   default CURRENT_TIMESTAMP not null,
    discussion_id integer references action_discussion                 not null,
    message       text                                                 not null
);

create view action_discussion_feed
as
select ad.id,
       ad.collectivite_id,
       ad.action_id,
       ad.created_by,
       ad.created_at,
       ad.modified_at,
       ad.status,
       utilisateur.modified_by_nom(created_by) as created_by_nom,
       (select array_agg(adc) from action_discussion_commentaire adc where adc.discussion_id = ad.id) as commentaires
from action_discussion ad;

-- Les autres commentaires sont visibles par tous les membres de la collectivité.
create policy allow_read
    on action_discussion_commentaire
    for select
    using (have_lecture_acces((select collectivite_id from action_discussion ad where ad.id = discussion_id)));

-- Le commentaire peut être modifié par son créateur.
create policy allow_update
    on action_discussion_commentaire
    for update
    using (created_by=auth.uid());

-- Le commentaire peut être supprimé par son créateur ou l’un des membres participant au commentaire.
create policy allow_delete
    on action_discussion_commentaire
    for update
    using (created_by=auth.uid());

COMMIT;
