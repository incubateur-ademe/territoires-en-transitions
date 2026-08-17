-- Verify tet:demarche/statut_publication_fusionne on pg

BEGIN;

DO $$
DECLARE
    status_check text;
BEGIN
    ASSERT NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche'
          AND column_name = 'publication_status'
    ), 'La colonne publication_status doit avoir été supprimée';

    SELECT pg_get_constraintdef(oid) INTO status_check
    FROM pg_constraint
    WHERE conrelid = 'public.demarche'::regclass AND conname = 'demarche_status_check';

    ASSERT status_check LIKE '%''publie''%',
        'La contrainte CHECK de status doit accepter le statut publie';
END $$;

ROLLBACK;
