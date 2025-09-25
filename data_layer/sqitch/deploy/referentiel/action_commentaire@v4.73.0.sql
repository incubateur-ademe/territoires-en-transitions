-- Deploy tet:referentiel/action_commentaire to pg
-- requires: referentiel/contenu

BEGIN;

create table action_commentaire
(
    collectivite_id integer references collectivite                      not null,
    action_id       action_id references action_relation                 not null,
    commentaire     text                                                 not null,
    modified_by     uuid references auth.users default auth.uid()        not null,
    modified_at     timestamp with time zone   default CURRENT_TIMESTAMP not null,
    primary key (collectivite_id, action_id)
);

create trigger set_modified_at_before_action_commentaire_update
    before update
    on
        action_commentaire
    for each row
execute procedure update_modified_at();


alter table action_commentaire
    enable row level security;

create policy allow_read
    on action_commentaire
    for select
    using (is_authenticated());

create policy allow_insert
    on action_commentaire
    for insert
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));
create policy allow_update
    on action_commentaire
    for update
    using (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                              collectivite_id));

COMMIT;
