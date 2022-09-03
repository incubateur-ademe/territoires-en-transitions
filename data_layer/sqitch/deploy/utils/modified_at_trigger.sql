-- Deploy tet:utils/modified_at_trigger to pg

BEGIN;

create function
    private.add_modified_at_trigger(
    table_schema text,
    table_name text
)
    returns void
as
$$
begin
    if not exists(select null
                  from information_schema.columns c
                  where c.table_schema = add_modified_at_trigger.table_schema
                    and c.table_name = add_modified_at_trigger.table_name
                    and column_name = 'modified_at')
    then
        execute format(
                'alter table %I.%I
                    add modified_at timestamp with time zone not null;',
                add_modified_at_trigger.table_schema,
                add_modified_at_trigger.table_name
            );
    end if;

    execute format(
            'create trigger modified_at
                before insert or update
                on %I.%I
                for each row
            execute procedure update_modified_at();',
            add_modified_at_trigger.table_schema,
            add_modified_at_trigger.table_name
        );
end;
$$ language plpgsql;
comment on function private.add_modified_at_trigger is
    'Ajoute le trigger (et si nécessaire la colonne) modified_at à une table.';

COMMIT;
