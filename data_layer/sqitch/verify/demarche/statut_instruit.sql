-- Verify tet:demarche/statut_instruit on pg

BEGIN;

DO $$
DECLARE
    status_check text;
BEGIN
    SELECT pg_get_constraintdef(oid) INTO status_check
    FROM pg_constraint
    WHERE conrelid = 'public.demarche'::regclass AND conname = 'demarche_status_check';

    ASSERT status_check LIKE '%''instruit''%',
        'La contrainte CHECK de status doit accepter le statut instruit';
    ASSERT status_check NOT LIKE '%''adopte''%',
        'La contrainte CHECK de status ne doit plus accepter le statut adopte';

    ASSERT NOT EXISTS (
        SELECT 1 FROM public.demarche WHERE type = 'pcaet' AND status = 'adopte'
    ), 'Aucune démarche ne doit rester au statut adopte';
END $$;

ROLLBACK;
