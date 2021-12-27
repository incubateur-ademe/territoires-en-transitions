create type fiche_action_avancement as enum ('pas_fait', 'fait', 'en_cours');

-- fiche action
create table fiche_action
(
    id                          serial primary key,
    collectivite_id             integer references collectivite,
    uid                         uuid                    not null,
    avancement                  fiche_action_avancement not null,
    numerotation                text                    not null,
    titre                       text                    not null,
    description                 text                    not null,
    structure_pilote            text                    not null,
    personne_referente          text                    not null,
    elu_referent                text                    not null,
    partenaires                 text                    not null,
    budget_global               integer                 not null,
    commentaire                 text                    not null,
    date_fin                    text                    not null,
    date_debut                  text                    not null,
    en_retard                   boolean                 not null,
    -- relations to other tables
    action_ids                  action_id[]             not null,
    indicateur_ids              indicateur_id[]         not null,
    indicateur_personnalise_ids integer[]               not null
) inherits (absract_modified_at);
comment on table fiche_action is 'Fiche action used by the client';

create table fiche_action_action
(
    fiche_action_id integer references fiche_action,
    action_id       action_id references action_relation,
    primary key (fiche_action_id, action_id)
);
comment on table fiche_action is
    'Many-to-many relationship between fiche action and referentiel action';

create table fiche_action_indicateur
(
    fiche_action_id integer references fiche_action,
    indicateur_id   indicateur_id references indicateur_definition,
    primary key (fiche_action_id, indicateur_id)
);
comment on table fiche_action_indicateur is
    'Many-to-many relationship between fiche action and referentiel indicateur';

create table fiche_action_indicateur_personnalise
(
    fiche_action_id            integer references fiche_action,
    indicateur_personnalise_id integer references indicateur_personnalise_definition,
    primary key (fiche_action_id, indicateur_personnalise_id)
);
comment on table fiche_action_indicateur_personnalise is
    'Many-to-many relationship between fiche action and indicateur personnalisé';


create or replace function update_fiche_relationships(
    fiche_action_id integer,
    action_ids action_id[],
    indicateur_ids indicateur_id[],
    indicateur_personnalise_ids integer[]
) returns void as
$$
declare
    id integer;
    i  action_id;
    j  indicateur_id;
    k  integer;
begin
    -- the name fiche_action_id is ambiguous as it can refer to a column.
    select update_fiche_relationships.fiche_action_id into id;

    -- clear previous relationships
    delete from fiche_action_action where fiche_action_action.fiche_action_id = id;
    delete from fiche_action_indicateur where fiche_action_indicateur.fiche_action_id = id;
    delete from fiche_action_indicateur_personnalise where fiche_action_indicateur_personnalise.fiche_action_id = id;

    -- write relationships
    foreach i in array action_ids
        loop
            insert into fiche_action_action (fiche_action_id, action_id)
            values (id, i);
        end loop;

    foreach j in array indicateur_ids
        loop
            insert into fiche_action_indicateur (fiche_action_id, indicateur_id)
            values (id, j);
        end loop;

    foreach k in array indicateur_personnalise_ids
        loop
            insert into fiche_action_indicateur_personnalise (fiche_action_id, indicateur_personnalise_id)
            values (id, k);
        end loop;
end;
$$
    language plpgsql;
comment on function update_fiche_relationships is
    'Update fiche action relationships with actions, indicateurs and indicateurs personnalisés';


create or replace function after_fiche_action_write_save_relationships() returns trigger as
$$
begin
    perform update_fiche_relationships(
            new.id,
            new.action_ids,
            new.indicateur_ids,
            new.indicateur_personnalise_ids
        );
    return new;
end;
$$ language plpgsql;

create trigger after_fiche_action_write
    after insert or update
    on fiche_action
    for each row
execute procedure after_fiche_action_write_save_relationships();

comment on function after_fiche_action_write_save_relationships is
    'Save relationships with actions, indicateurs and indicateurs personnalisés '
        'from fiche action data on insert or update to ensure they are correct';

-- plan d'action
create table plan_action
(
    id                 serial primary key,
    collectivite_id    integer references collectivite,
    uid                varchar(36)                                        not null,
    nom                varchar(300)                                       not null,
    categories         jsonb                                              not null,
    fiches_by_category jsonb                                              not null,
    created_at         timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at        timestamp with time zone default CURRENT_TIMESTAMP not null
);
