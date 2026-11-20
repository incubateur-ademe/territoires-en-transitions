-- Revert tet:referentiel/audit_preuves_archive_audit_optionnel from pg

BEGIN;

DELETE FROM public.audit_preuves_archive WHERE audit_id IS NULL;

DROP INDEX public.audit_preuves_archive_in_flight_unique;
CREATE UNIQUE INDEX audit_preuves_archive_in_flight_unique
    ON public.audit_preuves_archive (audit_id, requested_by)
    WHERE status IN ('pending', 'processing');

ALTER TABLE public.audit_preuves_archive ALTER COLUMN audit_id SET NOT NULL;

COMMENT ON TABLE public.audit_preuves_archive IS 'Job de génération asynchrone d''archive ZIP des preuves d''un audit.';
COMMENT ON COLUMN public.audit_preuves_archive.referentiel_id IS 'Identifiant du référentiel de l''audit.';
COMMENT ON COLUMN public.audit_preuves_archive.audit_id IS NULL;

COMMIT;
