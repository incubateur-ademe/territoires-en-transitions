create type nature as enum ('SMF', 'CU', 'CC', 'SIVOM', 'POLEM', 'METRO', 'SMO', 'CA', 'EPT', 'SIVU', 'PETR');
create domain siren as varchar(9)
    check (
        value ~ '^\d{9}$'
        );
create domain codegeo as varchar(5);

-- Collectivité, the base type we relate to.
create table collectivite
(
    id          serial primary key,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table collectivite is 'Collectivite base table';

alter table collectivite
    enable row level security;

create policy collectivite_read_for_all
    on collectivite
    for select
    using (true);

-- Epci, a type of collectivité
create table epci
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    nom             varchar(300) not null,
    siren           siren unique not null,
    nature          nature       not null
);
comment on table epci is 'Établissement public de coopération intercommunale';

alter table epci
    enable row level security;

create policy epci_read_for_all
    on epci
    for select
    using (true);


-- Commune, a type of collectivité
create table commune
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    nom             varchar(300)   not null,
    code            codegeo unique not null
);

-- A collectivité with a name from it's underlying type
create or replace view named_collectivite
as
select collectivite.id as collectivite_id,
       coalesce(epci.nom, commune.nom) as nom
from collectivite
         left join epci on epci.collectivite_id = collectivite.id
         left join commune on commune.collectivite_id = collectivite.id
order by nom;
comment on view named_collectivite is 'Collectivité with the necessary information to display in the client.';


-- Triggers, create collectivité when a related type is inserted.
create or replace function before_epci_write_create_collectivite() returns trigger as
$$
declare
    created_collectivite_id integer;
begin
    insert into collectivite default values;
    select currval(pg_get_serial_sequence('collectivite', 'id')) into created_collectivite_id;
    new.collectivite_id = created_collectivite_id;
    -- The new is what will be inserted
    return new;
end;
$$ language plpgsql;

create trigger before_epci_write
    before insert
    on epci
    for each row
execute procedure before_epci_write_create_collectivite();


create or replace function before_commune_write_create_collectivite() returns trigger as
$$
declare
    created_collectivite_id integer;
begin
    insert into collectivite default values;
    select currval(pg_get_serial_sequence('collectivite', 'id')) into created_collectivite_id;
    new.collectivite_id = created_collectivite_id;
    -- The new is what will be inserted
    return new;
end;
$$ language plpgsql;

create trigger before_commune_write
    before insert
    on commune
    for each row
execute procedure before_commune_write_create_collectivite();


