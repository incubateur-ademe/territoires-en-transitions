-- Deploy tet:collectivites to pg
-- requires: base
-- requires: imports

BEGIN;

create extension unaccent;

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

alter table commune
    enable row level security;

create policy commune_read_for_all
    on commune
    for select
    using (true);


-- Test collectivité
create table collectivite_test
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    nom             varchar(300) not null
);

alter table collectivite_test
    enable row level security;

create policy collectivite_test_read_for_all
    on collectivite_test
    for select
    using (true);


-- A collectivité with a name from it's underlying type
create or replace view named_collectivite
as
select collectivite.id                                        as collectivite_id,
       coalesce(epci.nom, commune.nom, collectivite_test.nom) as nom
from collectivite
         left join epci on epci.collectivite_id = collectivite.id
         left join commune on commune.collectivite_id = collectivite.id
         left join collectivite_test on collectivite_test.collectivite_id = collectivite.id
order by case
             when collectivite_test.nom is not null
                 -- display test collectivités before regular collectivités
                 then '0' || unaccent(collectivite_test.nom)
             else
                 unaccent(coalesce(epci.nom, commune.nom))
             end
;
comment on view named_collectivite is 'Collectivité with the necessary information to display in the client.';


-- Triggers, create collectivité when a related type is inserted.
create or replace function before_write_create_collectivite() returns trigger as
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
execute procedure before_write_create_collectivite();


create trigger before_commune_write
    before insert
    on commune
    for each row
execute procedure before_write_create_collectivite();


create trigger before_collectivite_test_write
    before insert
    on collectivite_test
    for each row
execute procedure before_write_create_collectivite();


COMMIT;
