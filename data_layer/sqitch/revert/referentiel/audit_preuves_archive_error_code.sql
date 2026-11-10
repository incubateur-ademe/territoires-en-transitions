-- Revert tet:referentiel/audit_preuves_archive_error_code from pg

BEGIN;

ALTER TABLE public.audit_preuves_archive DROP COLUMN IF EXISTS error_code;

COMMIT;
