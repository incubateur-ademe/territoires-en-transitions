-- Verify tet:shared/action_de_reference_code on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT (
            SELECT is_nullable = 'YES' AND data_type = 'text'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'action_de_reference'
              AND column_name = 'code'
        ), 'La colonne code doit exister, de type text et nullable';

        ASSERT (
            SELECT count(*) = 2
            FROM pg_constraint
            WHERE conrelid = 'public.action_de_reference'::regclass
              AND conname IN ('action_de_reference_code_unique', 'action_de_reference_code_format')
        ), 'Les contraintes code unique et code format doivent exister';
    END
$$;

ROLLBACK;
