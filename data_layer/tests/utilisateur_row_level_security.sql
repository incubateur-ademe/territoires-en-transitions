begin;
select plan(1);

select set_eq('select tablename from pg_catalog.pg_tables where schemaname = ''public''',
              'select tablename from pg_catalog.pg_tables where schemaname = ''public'' and rowsecurity',
              'Every public table must have RLS enabled');

rollback;
