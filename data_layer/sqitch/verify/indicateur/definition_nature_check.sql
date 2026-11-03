BEGIN;

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.indicateur_definition'::regclass
          AND conname = 'indicateur_definition_nature_check'
          AND contype = 'c'
          AND convalidated
    ), 'La contrainte de nature doit exister et être validée';
END $$;

ROLLBACK;
