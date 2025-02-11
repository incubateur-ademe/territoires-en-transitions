-- Verify tet:utils/maintenance on pg

BEGIN;

select 1 / count(*)
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'maintenance';

ROLLBACK;
