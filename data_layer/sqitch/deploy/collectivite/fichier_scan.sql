-- Deploy tet:collectivite/fichier_scan to pg
-- requires: collectivite/bucket_rls_membre_read

BEGIN;

CREATE TABLE public.collectivite_fichier_scan (
    id             integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    bucket_id      text        NOT NULL,
    object_name    text        NOT NULL,
    status         text        NOT NULL,
    signature      text        NULL,
    engine_version text        NULL,
    attempts       integer     NOT NULL DEFAULT 1,
    scanned_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz NULL,
    CONSTRAINT collectivite_fichier_scan_status_check
        CHECK (status IN ('clean', 'infected', 'error')),
    CONSTRAINT collectivite_fichier_scan_signature_si_infecte
        CHECK (status <> 'infected' OR signature IS NOT NULL),
    CONSTRAINT collectivite_fichier_scan_unique_objet
        UNIQUE (bucket_id, object_name)
);

COMMENT ON TABLE public.collectivite_fichier_scan IS 'Verdict de l''analyse antivirus de chaque objet des buckets de collectivité. Clé (bucket_id, object_name) et non FK vers storage.objects : le verdict d''un fichier infecté survit à la suppression de son blob.';
COMMENT ON COLUMN public.collectivite_fichier_scan.attempts IS 'Analyses tentées ; un statut error est retenté tant que ce compteur reste sous le plafond du backend.';
COMMENT ON COLUMN public.collectivite_fichier_scan.deleted_at IS 'Suppression du blob infecté ; null en mode audit, où le verdict est seulement consigné.';

ALTER TABLE public.collectivite_fichier_scan ENABLE ROW LEVEL SECURITY;

COMMIT;
