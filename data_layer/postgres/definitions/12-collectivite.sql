create type nature as enum ('SMF', 'CU', 'CC', 'SIVOM', 'POLEM', 'MET69', 'METRO', 'SMO', 'CA', 'EPT', 'SIVU', 'PETR');
create domain siren as varchar(9)
    check (
            value ~ '^\d{9}$'
        );

create table collectivite
(
    id          serial primary key,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table collectivite is 'Collectivite base table';

create table epci
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    nom             varchar(300) not null,
    siren           siren unique not null,
    nature          nature       not null
);
comment on table epci is 'Établissement public de coopération intercommunale';

create view named_collectivite
as
select collectivite_id, epci.nom as nom
from collectivite
         join epci on epci.collectivite_id = collectivite.id
order by nom;
comment on view named_collectivite is 'All EPCIs with the necessary information to display in the client.';

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

