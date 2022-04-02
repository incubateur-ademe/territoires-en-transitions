--------------------------------
------ ACTION COMMENTAIRE ------
--------------------------------
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


--------------------------------
---- INDICATEUR REFERENTIEL ----
--------------------------------
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

--------------------------------
------- INDICATEUR PERSO -------
--------------------------------
create table indicateur_personnalise_definition
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    titre           text                                          not null,
    description     text                                          not null,
    unite           text                                          not null,
    commentaire     text                                          not null,
    modified_by     uuid references auth.users default auth.uid() not null
) inherits (abstract_modified_at);

create trigger set_modified_at_before_indicateur_personnalise_def_update
    before update
    on
        indicateur_personnalise_definition
    for each row
execute procedure update_modified_at();

alter table indicateur_personnalise_definition
    enable row level security;

create policy allow_read
    on indicateur_personnalise_definition
    for select
    using (is_authenticated());

create policy allow_insert
    on indicateur_personnalise_definition
    for insert
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));

create policy allow_update
    on indicateur_personnalise_definition
    for update
    using (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                              collectivite_id));


create table indicateur_personnalise_resultat
(
    collectivite_id            integer references collectivite,
    indicateur_id integer references indicateur_personnalise_definition not null,
    primary key (indicateur_id, annee, collectivite_id)
) inherits (abstract_any_indicateur_value);

create trigger set_modified_at_before_indicateur_personnalise_res_update
    before update
    on
        indicateur_personnalise_resultat
    for each row
execute procedure update_modified_at();

alter table indicateur_personnalise_resultat
    enable row level security;

create policy allow_read
    on indicateur_personnalise_resultat
    for select
    using (is_authenticated());

create policy allow_insert
    on indicateur_personnalise_resultat
    for insert
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));

create policy allow_update
    on indicateur_personnalise_resultat
    for update
    using (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                              collectivite_id));


create table indicateur_personnalise_objectif
(
    collectivite_id            integer references collectivite,
    indicateur_id integer references indicateur_personnalise_definition not null,
    primary key (indicateur_id, annee, collectivite_id)
) inherits (abstract_any_indicateur_value);

create trigger set_modified_at_before_indicateur_personnalise_objectif_update
    before update
    on
        indicateur_personnalise_objectif
    for each row
execute procedure update_modified_at();

alter table indicateur_personnalise_objectif
    enable row level security;

create policy allow_read
    on indicateur_personnalise_objectif
    for select
    using (is_authenticated());

create policy allow_insert
    on indicateur_personnalise_objectif
    for insert
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));

create policy allow_update
    on indicateur_personnalise_objectif
    for update
    using (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                              collectivite_id));

