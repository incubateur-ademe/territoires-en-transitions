-- Verify tet:referentiel/audit_preuves_archive_error_code on pg

BEGIN;

SELECT error_code FROM public.audit_preuves_archive WHERE false;

ROLLBACK;
