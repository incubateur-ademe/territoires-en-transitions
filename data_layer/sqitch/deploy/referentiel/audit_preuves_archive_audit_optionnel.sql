-- Deploy tet:referentiel/audit_preuves_archive_audit_optionnel to pg

BEGIN;

-- Sans audit (jamais audité), l'archive ne contient que les preuves des mesures.
ALTER TABLE public.audit_preuves_archive ALTER COLUMN audit_id DROP NOT NULL;

COMMENT ON TABLE public.audit_preuves_archive IS 'Job de génération asynchrone d''archive ZIP des preuves d''une collectivité sur un référentiel.';
COMMENT ON COLUMN public.audit_preuves_archive.referentiel_id IS 'Identifiant du référentiel archivé.';
COMMENT ON COLUMN public.audit_preuves_archive.audit_id IS 'Audit dont les documents de demande et d''audit sont inclus ; NULL sans dossier de labellisation.';

-- L'audit ciblé dépend du moment de la demande : l'unicité des archives en
-- cours se fait par collectivité, référentiel et demandeur·se.
DROP INDEX public.audit_preuves_archive_in_flight_unique;

-- L'ancienne clé (audit_id, requested_by) autorisait plusieurs archives en
-- cours pour une même clé ; seule la plus récente est gardée en cours.
UPDATE public.audit_preuves_archive a
SET status = 'failed',
    error_message = 'Remplacée par une archive plus récente'
WHERE a.status IN ('pending', 'processing')
  AND EXISTS (
    SELECT 1
    FROM public.audit_preuves_archive b
    WHERE b.collectivite_id = a.collectivite_id
      AND b.referentiel_id = a.referentiel_id
      AND b.requested_by = a.requested_by
      AND b.status IN ('pending', 'processing')
      AND (b.created_at, b.id) > (a.created_at, a.id)
  );

CREATE UNIQUE INDEX audit_preuves_archive_in_flight_unique
    ON public.audit_preuves_archive (collectivite_id, referentiel_id, requested_by)
    WHERE status IN ('pending', 'processing');

COMMIT;
