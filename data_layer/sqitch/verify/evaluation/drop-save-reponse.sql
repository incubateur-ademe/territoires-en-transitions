-- Verify tet:evaluation/drop-save-reponse on pg

BEGIN;

-- vérifie que la fonction save_reponse(json) a bien été supprimée
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'save_reponse'
          AND n.nspname = 'public'
          AND pg_get_function_identity_arguments(p.oid) = 'json'
    ) THEN
        RAISE EXCEPTION 'La fonction save_reponse(json) existe encore';
    END IF;
END $$;

ROLLBACK;
