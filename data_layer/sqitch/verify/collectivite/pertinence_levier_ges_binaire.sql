-- Verify tet:collectivite/pertinence_levier_ges_binaire on pg

BEGIN;

DO
$$
    DECLARE
        labels text;
    BEGIN
        SELECT string_agg(enumlabel, ',' ORDER BY enumsortorder) INTO labels
        FROM pg_enum
        WHERE enumtypid = 'public.levier_pertinence'::regtype;

        ASSERT labels = 'non_pertinent,pertinent',
            'Le type levier_pertinence doit declarer exactement non_pertinent puis pertinent, or : ' || coalesce(labels, 'aucune valeur');

        ASSERT NOT EXISTS (
            SELECT 1
            FROM pg_type
            WHERE typnamespace = 'public'::regnamespace
              AND typname = 'levier_pertinence_old'
        ), 'L''ancien type levier_pertinence_old doit avoir ete supprime';

        ASSERT (
            SELECT is_nullable = 'NO' AND udt_name = 'levier_pertinence'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'collectivite_levier_ges_pertinence'
              AND column_name = 'pertinence'
        ), 'La colonne pertinence doit rester NOT NULL et de type levier_pertinence';
    END
$$;

ROLLBACK;
