--------------------------------
----------- TYPING -------------
--------------------------------
create or replace function udt_name_to_json_type(udt_name text) returns json
as
$$
begin
    return
        case
            -- supported types
            when udt_name ~ '^bool' then json_build_object('type', 'boolean')
            when udt_name ~ '^int' then json_build_object('type', 'int32')
            when udt_name ~ '^float' then json_build_object('type', 'float64')
            when udt_name ~ '^timestamp' then json_build_object('type', 'timestamp')
            -- lists
            when udt_name ~ '^_int' then json_build_object('elements', json_build_object('type', 'int32'))
            when udt_name ~ '^_float' then json_build_object('elements', json_build_object('type', 'float64'))
            when udt_name ~ '^_' then json_build_object('elements', json_build_object('type', 'string'))
            -- fallback to string
            else json_build_object('type', 'string')
            end;
end;
$$ language plpgsql;
comment on function udt_name_to_json_type(udt_name text) is
    'Returns a type as a string compatible with json type definition.';

create or replace view table_as_json_typedef
as
with table_columns as (
    select columns.table_name     as title,
           column_name,
           column_default is null as mandatory,
           udt_name

    from information_schema.columns
    where table_schema = 'public'
),
     json_type_def as (
         select title,
                json_object_agg(
                        column_name,
                        udt_name_to_json_type(udt_name)
                    )                      as all_properties,

                json_object_agg(
                column_name,
                udt_name_to_json_type(udt_name))
                filter ( where mandatory ) as writable_properties

         from table_columns
         group by title
     )
select title,
       json_build_object('properties', coalesce(all_properties, '{}'))      as read,
       json_build_object('properties', coalesce(writable_properties, '{}')) as write
from json_type_def;
comment on view table_as_json_typedef is
    'Json type definition for all public tables (including views). Only non nullable/non default fields are listed';

select *
from table_as_json_typedef
where title = 'fiche_action';

select columns.table_name     as title,
       column_name,
       column_default is null as mandatory,
       udt_name

from information_schema.columns
where table_schema = 'public'
  and table_name = 'fiche_action';
