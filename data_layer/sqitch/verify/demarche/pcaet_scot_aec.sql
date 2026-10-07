-- Verify tet:demarche/pcaet_scot_aec on pg

BEGIN;

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche'
          AND column_name = 'is_scot_aec' AND data_type = 'boolean'
            AND is_nullable = 'NO'
    ), 'La colonne is_scot_aec (boolean not null) doit exister sur public.demarche';
END $$;

ROLLBACK;
