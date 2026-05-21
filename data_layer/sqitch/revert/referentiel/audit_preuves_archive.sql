-- Revert tet:referentiel/audit_preuves_archive from pg

BEGIN;

DELETE FROM storage.buckets WHERE id = 'preuves-archives';

DROP TABLE IF EXISTS public.audit_preuves_archive CASCADE;

COMMIT;
