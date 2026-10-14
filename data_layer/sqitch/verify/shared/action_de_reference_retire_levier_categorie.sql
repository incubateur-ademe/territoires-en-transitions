-- Verify tet:shared/action_de_reference_retire_levier_categorie on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT (
            SELECT count(*) = 0
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'action_de_reference'
              AND column_name IN ('levier', 'categorie')
        ), 'Les colonnes levier et categorie doivent avoir disparu de action_de_reference';

        ASSERT (
            SELECT count(*) = 1
            FROM pg_constraint
            WHERE conrelid = 'public.action_de_reference'::regclass
              AND conname = 'action_de_reference_titre_unique'
              AND contype = 'u'
        ), 'La contrainte action_de_reference_titre_unique doit exister';
    END
$$;

ROLLBACK;
