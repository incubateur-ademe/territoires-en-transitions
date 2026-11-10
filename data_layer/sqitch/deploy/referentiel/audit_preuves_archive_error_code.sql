-- Deploy tet:referentiel/audit_preuves_archive_error_code to pg

BEGIN;

ALTER TABLE public.audit_preuves_archive
    ADD COLUMN error_code text NULL
        CHECK (error_code IN ('TOO_MANY_FILES', 'ARCHIVE_TOO_LARGE'));

COMMENT ON COLUMN public.audit_preuves_archive.error_code IS
    'Cause de l''échec affichable à l''utilisateur·ice (TOO_MANY_FILES | ARCHIVE_TOO_LARGE) ; NULL si inconnue.';

COMMIT;
