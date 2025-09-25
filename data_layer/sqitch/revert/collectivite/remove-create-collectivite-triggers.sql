-- Revert tet:collectivite/remove-create-collectivite-triggers from pg

BEGIN;

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
