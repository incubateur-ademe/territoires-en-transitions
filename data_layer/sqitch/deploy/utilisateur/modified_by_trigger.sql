-- Deploy tet:utilisateur/modified_by_trigger to pg

BEGIN;

create function utilisateur.update_modified_by() returns trigger
as
$$
begin
    new.modified_by = auth.uid();
    return new;
end;
$$ language plpgsql;


create function
    utilisateur.add_modified_by_trigger(
    table_schema text,
    table_name text
)
    returns void
as
$$
begin
    if not exists(select null
                  from information_schema.columns c
                  where c.table_schema = add_modified_by_trigger.table_schema
                    and c.table_name = add_modified_by_trigger.table_name
                    and column_name = 'modified_by')
    then
        execute format(
                'alter table %I.%I
                    add modified_by uuid references auth.users;', -- nullable so we can work with service keys
                add_modified_by_trigger.table_schema,
                add_modified_by_trigger.table_name
            );
    end if;

    execute format(
            'create trigger modified_by
                before insert or update
                on %I.%I
                for each row
            execute procedure utilisateur.update_modified_by();',
            add_modified_by_trigger.table_schema,
            add_modified_by_trigger.table_name
        );
end;
$$ language plpgsql;
comment on function utilisateur.add_modified_by_trigger is
    'Ajoute les triggers (et si nécessaire la colonne) modified_by à une table.';


COMMIT;
