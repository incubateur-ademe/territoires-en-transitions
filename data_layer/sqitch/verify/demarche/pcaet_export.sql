-- Verify tet:demarche/pcaet_export on pg

BEGIN;

SELECT id, demarche_id, transition, type, storage_path, filename, created_at, created_by
FROM public.demarche_pcaet_export
WHERE false;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'demarche_pcaet_export_demarche_transition_type_key'
          AND conrelid = 'public.demarche_pcaet_export'::regclass
    ) THEN
        RAISE EXCEPTION 'la contrainte d''unicité (demarche_id, transition, type) manque';
    END IF;

    IF NOT (
        SELECT relrowsecurity FROM pg_class
        WHERE oid = 'public.demarche_pcaet_export'::regclass
    ) THEN
        RAISE EXCEPTION 'la RLS n''est pas activée sur demarche_pcaet_export';
    END IF;

    IF has_table_privilege('anon', 'public.demarche_pcaet_export', 'SELECT')
    THEN
        RAISE EXCEPTION 'anon peut lire demarche_pcaet_export';
    END IF;

    IF has_table_privilege('authenticated', 'public.demarche_pcaet_export', 'SELECT')
    THEN
        RAISE EXCEPTION 'authenticated peut lire demarche_pcaet_export';
    END IF;
END $$;

ROLLBACK;
