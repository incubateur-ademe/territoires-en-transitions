-- Verify tet:demarche/pcaet_date_adoption on pg

BEGIN;

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche'
          AND column_name = 'adopted_at' AND data_type = 'date'
    ), 'La colonne adopted_at (date) doit exister sur public.demarche';
END $$;

ROLLBACK;
