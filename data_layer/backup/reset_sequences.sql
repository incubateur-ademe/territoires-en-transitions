-- Reset all sequences to match the actual MAX value of their owning column.
-- Safe to run multiple times (idempotent).
-- Logs warnings for sequences it cannot reset (e.g. auth/storage schemas on Supabase).
do $$
declare
  r record;
  max_val bigint;
begin
  for r in
    select
      quote_ident(n.nspname) as schemaname,
      quote_ident(c.relname) as tablename,
      quote_ident(a.attname) as colname,
      pg_get_serial_sequence(
        quote_ident(n.nspname) || '.' || quote_ident(c.relname),
        a.attname
      ) as seqname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid
    join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
    where c.relkind = 'r'
      and a.attnum > 0
      and not a.attisdropped
      and pg_get_serial_sequence(
        quote_ident(n.nspname) || '.' || quote_ident(c.relname),
        a.attname
      ) is not null
  loop
    begin
      execute format(
        'select coalesce(max(%s), 0) from %s.%s',
        r.colname, r.schemaname, r.tablename
      ) into max_val;

      if max_val = 0 then
        execute format('select setval(%L, 1, false)', r.seqname);
        raise notice 'Reset sequence % to 1 (empty table %.%)',
          r.seqname, r.schemaname, r.tablename;
      else
        execute format('select setval(%L, %s, true)', r.seqname, max_val);
        raise notice 'Reset sequence % to % (%.%)',
          r.seqname, max_val, r.schemaname, r.tablename;
      end if;
    exception
      when insufficient_privilege then
        raise warning 'Could not reset sequence % — not owner of %.%',
          r.seqname, r.schemaname, r.tablename;
      when others then
        raise warning 'Error resetting sequence %: %', r.seqname, sqlerrm;
    end;
  end loop;
end $$;
