-- Verify tet:indicateur/total_est_cumul_retire on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'indicateur_definition'
          AND column_name = 'total_est_cumul_des_sous_indicateurs'
    ) THEN
        RAISE EXCEPTION 'La colonne total_est_cumul_des_sous_indicateurs existe encore';
    END IF;
END
$$;

ROLLBACK;
