--------------------------------
--------ACTION COMMENTAIRE------
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

alter table action_commentaire
    enable row level security;

create policy "Enable select"
    on action_commentaire
    for select
    using (true);

create policy "Insert for authenticated user"
    on action_commentaire
    for insert
    with check (true);


create table abstract_any_indicateur_value
(
    valeur float,
    annee  integer not null
) inherits (absract_modified_at);

create table indicateur_resultat
(
    collectivite_id integer references collectivite,
    indicateur_id   indicateur_id references indicateur_definition not null,
    primary key (collectivite_id, annee, indicateur_id)
) inherits (abstract_any_indicateur_value);

create table indicateur_objectif
(

    collectivite_id integer references collectivite,
    indicateur_id   indicateur_id references indicateur_definition,
    primary key (collectivite_id, annee, indicateur_id)
) inherits (abstract_any_indicateur_value);

create table indicateur_commentaire
(
    collectivite_id integer references collectivite,
    indicateur_id   indicateur_id references indicateur_definition not null,
    commentaire     text                                           not null,
    modified_by     uuid references auth.users default auth.uid()  not null,
    primary key (collectivite_id, indicateur_id)
) inherits (absract_modified_at);


-- perso
create table indicateur_personnalise_definition
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    titre           text                                          not null,
    description     text                                          not null,
    unite           text                                          not null,
    commentaire     text                                          not null,
    modified_by     uuid references auth.users default auth.uid() not null
) inherits (absract_modified_at);

create table indicateur_personnalise_resultat
(
    collectivite_id            integer references collectivite,
    indicateur_id integer references indicateur_personnalise_definition not null,
    primary key (indicateur_id, annee, collectivite_id)
) inherits (abstract_any_indicateur_value);

create table indicateur_personnalise_objectif
(
    collectivite_id            integer references collectivite,
    indicateur_id integer references indicateur_personnalise_definition not null,
    primary key (indicateur_id, annee, collectivite_id)
) inherits (abstract_any_indicateur_value);

