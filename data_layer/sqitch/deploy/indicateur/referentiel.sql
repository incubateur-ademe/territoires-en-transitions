-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

create table abstract_any_indicateur_value
(
    valeur float,
    annee  integer not null
) inherits (abstract_modified_at);

alter table abstract_any_indicateur_value
    enable row level security;

create table indicateur_resultat
(
    collectivite_id integer references collectivite,
    indicateur_id   indicateur_id references indicateur_definition not null,
    primary key (collectivite_id, annee, indicateur_id)
) inherits (abstract_any_indicateur_value);

create trigger set_modified_at_before_indicateur_resultat_update
    before update
    on
        indicateur_resultat
    for each row
execute procedure update_modified_at();

alter table indicateur_resultat
    enable row level security;

create policy allow_read
    on indicateur_resultat
    for select
    using (is_authenticated());

create policy allow_insert
    on indicateur_resultat
    for insert
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));

create policy allow_update
    on indicateur_resultat
    for update
    using (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                              collectivite_id));

create table indicateur_objectif
(

    collectivite_id integer references collectivite,
    indicateur_id   indicateur_id references indicateur_definition,
    primary key (collectivite_id, annee, indicateur_id)
) inherits (abstract_any_indicateur_value);

create trigger set_modified_at_before_indicateur_objectif_update
    before update
    on
        indicateur_objectif
    for each row
execute procedure update_modified_at();

alter table indicateur_objectif
    enable row level security;

create policy allow_read
    on indicateur_objectif
    for select
    using (is_authenticated());

create policy allow_insert
    on indicateur_objectif
    for insert
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));
create policy allow_update
    on indicateur_objectif
    for update
    using (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                              collectivite_id));


create table indicateur_commentaire
(
    collectivite_id integer references collectivite,
    indicateur_id   indicateur_id references indicateur_definition not null,
    commentaire     text                                           not null,
    modified_by     uuid references auth.users default auth.uid()  not null,
    primary key (collectivite_id, indicateur_id)
) inherits ("abstract_modified_at");

create trigger set_modified_at_before_indicateur_commentaire_update
    before update
    on
        indicateur_commentaire
    for each row
execute procedure update_modified_at();

alter table indicateur_commentaire
    enable row level security;

create policy allow_read
    on indicateur_commentaire
    for select
    using (is_authenticated());

create policy allow_insert
    on indicateur_commentaire
    for insert
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));

create policy allow_update
    on indicateur_commentaire
    for update
    using (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                              collectivite_id));

COMMIT;
