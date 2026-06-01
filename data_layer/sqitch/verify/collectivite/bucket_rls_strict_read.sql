-- Verify tet:collectivite/bucket_rls_strict_read on pg

BEGIN;

do $$
declare
    qual text;
begin
    select pg_get_expr(p.polqual, p.polrelid)
      into qual
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'storage'
       and c.relname = 'objects'
       and p.polname = 'allow_read';

    assert qual is not null,
        'La policy allow_read sur storage.objects doit exister';
    assert qual ilike '%is_bucket_writer%',
        format('La policy allow_read sur storage.objects doit utiliser is_bucket_writer (actuel: %s)', qual);
    assert qual not ilike '%is_authenticated%',
        format('La policy allow_read sur storage.objects ne doit plus utiliser is_authenticated (actuel: %s)', qual);
end
$$;

ROLLBACK;
