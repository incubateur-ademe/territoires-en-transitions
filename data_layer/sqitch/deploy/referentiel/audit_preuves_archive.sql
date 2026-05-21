-- Deploy tet:referentiel/audit_preuves_archive to pg

BEGIN;

CREATE TABLE public.audit_preuves_archive (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    collectivite_id integer     NOT NULL REFERENCES public.collectivite(id) ON DELETE CASCADE,
    referentiel_id  text        NOT NULL,
    audit_id        integer     NOT NULL REFERENCES labellisation.audit(id) ON DELETE CASCADE,
    requested_by    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status          text        NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_files     integer     NOT NULL DEFAULT 0,
    processed_files integer     NOT NULL DEFAULT 0,
    storage_path    text        NULL,
    error_message   text        NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    modified_at     timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz NOT NULL
);

COMMENT ON TABLE public.audit_preuves_archive IS 'Job de génération asynchrone d''archive ZIP des preuves d''un audit.';
COMMENT ON COLUMN public.audit_preuves_archive.referentiel_id IS 'Identifiant du référentiel de l''audit.';
COMMENT ON COLUMN public.audit_preuves_archive.requested_by IS 'Utilisateur·ice ayant demandé la génération.';
COMMENT ON COLUMN public.audit_preuves_archive.status IS 'pending | processing | completed | failed.';
COMMENT ON COLUMN public.audit_preuves_archive.storage_path IS 'Chemin de l''objet ZIP dans le bucket privé ; NULL tant que le job n''est pas completed.';
COMMENT ON COLUMN public.audit_preuves_archive.error_message IS 'Renseigné quand status = failed.';
COMMENT ON COLUMN public.audit_preuves_archive.expires_at IS 'Date d''expiration de l''archive (created_at + 7 jours).';

CREATE UNIQUE INDEX audit_preuves_archive_in_flight_unique
    ON public.audit_preuves_archive (audit_id, requested_by)
    WHERE status IN ('pending', 'processing');

-- RLS sans policy : seul service_role accède à la table.
ALTER TABLE public.audit_preuves_archive ENABLE ROW LEVEL SECURITY;

-- Bucket privé : téléchargement via signed URL générée à la demande.
INSERT INTO storage.buckets (id, name, public)
VALUES ('preuves-archives', 'preuves-archives', false)
ON CONFLICT DO NOTHING;

COMMIT;
