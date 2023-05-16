-- Deploy tet:utils/modified_by to pg

BEGIN;

create function enforce_modified_by()
    returns trigger
as
$$
begin
    new.modified_by = auth.uid();
    return new;
end;
$$ language plpgsql;


create function
    private.add_modified_by_trigger(
    table_schema text,
    table_name text
)
    returns void
as
$$
begin
    if not exists(select null
                  from information_schema.columns c
                  where c.table_schema = add_modified_by_trigger
                      .table_schema
                    and c.table_name = add_modified_by_trigger
                      .table_name
                    and column_name = 'modified_by')
    then
        execute format(
                'alter table %I.%I
                    add modified_by uuid not null;',
                add_modified_by_trigger
                    .table_schema,
                add_modified_by_trigger
                    .table_name
            );
    end if;

    execute format(
            'create trigger modified_by
                before insert or update
                on %I.%I
                for each row
            execute procedure enforce_modified_by();',
            add_modified_by_trigger
                .table_schema,
            add_modified_by_trigger
                .table_name
        );
end;
$$ language plpgsql;
comment on function private.add_modified_by_trigger
    is
        'Ajoute le trigger (et si nécessaire la colonne) modified_by à une table.';


COMMIT;
