-- Verify tet:collectivite/pertinence_levier_ges on pg

BEGIN;

DO
$$
    DECLARE
        label_attendu     text;
        contrainte_unique text;
    BEGIN
        FOREACH label_attendu IN ARRAY ARRAY ['non_pertinent', 'a_discuter', 'pertinent']
            LOOP
                ASSERT EXISTS (
                    SELECT 1
                    FROM pg_enum
                    WHERE enumtypid = 'public.levier_pertinence'::regtype
                      AND enumlabel = label_attendu
                ), 'Le type levier_pertinence doit declarer la valeur ' || label_attendu;
            END LOOP;

        ASSERT (
            SELECT is_nullable = 'NO'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'collectivite_levier_ges_pertinence'
              AND column_name = 'collectivite_id'
        ), 'La colonne collectivite_id doit etre NOT NULL';

        ASSERT (
            SELECT is_nullable = 'NO' AND column_default IS NOT NULL
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'collectivite_levier_ges_pertinence'
              AND column_name = 'modified_at'
        ), 'La colonne modified_at doit etre NOT NULL et avoir une valeur par defaut';

        ASSERT (
            SELECT is_nullable = 'NO' AND udt_name = 'levier_ges_id'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'collectivite_levier_ges_pertinence'
              AND column_name = 'levier_id'
        ), 'La colonne levier_id doit etre NOT NULL et de type levier_ges_id';

        ASSERT (
            SELECT is_nullable = 'YES' AND udt_name = 'volet_categorie'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'collectivite_levier_ges_pertinence'
              AND column_name = 'categorie'
        ), 'La colonne categorie doit etre nullable et de type volet_categorie : NULL porte la pertinence du levier';

        ASSERT (
            SELECT is_nullable = 'NO' AND udt_name = 'levier_pertinence'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'collectivite_levier_ges_pertinence'
              AND column_name = 'pertinence'
        ), 'La colonne pertinence doit etre NOT NULL et de type levier_pertinence';

        SELECT string_agg(a.attname, ',' ORDER BY k.ord) INTO contrainte_unique
        FROM pg_constraint c
                 JOIN pg_index i ON i.indexrelid = c.conindid
                 CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        WHERE c.conrelid = 'public.collectivite_levier_ges_pertinence'::regclass
          AND c.conname = 'collectivite_levier_ges_pertinence_unique'
          AND c.contype = 'u'
          AND NOT c.condeferrable
          AND i.indnullsnotdistinct;

        ASSERT contrainte_unique = 'collectivite_id,levier_id,categorie',
            'La contrainte collectivite_levier_ges_pertinence_unique doit porter, en NULLS NOT DISTINCT, sur (collectivite_id, levier_id, categorie) dans cet ordre, or : '
                || coalesce(contrainte_unique, 'contrainte absente, NULLS DISTINCT ou DEFERRABLE');

        ASSERT NOT EXISTS (
            SELECT 1
            FROM pg_index
            WHERE indrelid = 'public.collectivite_levier_ges_pertinence'::regclass
              AND indisprimary
        ), 'La table ne doit porter aucune cle primaire : categorie, nullable, fait partie de la cle metier';

        ASSERT EXISTS (
            SELECT 1
            FROM pg_constraint c
                     JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
            WHERE c.conrelid = 'public.collectivite_levier_ges_pertinence'::regclass
              AND c.contype = 'f'
              AND c.confrelid = 'public.collectivite'::regclass
              AND a.attname = 'collectivite_id'
              AND c.confdeltype = 'c'
        ), 'La suppression d''une collectivite doit supprimer ses pertinences (ON DELETE CASCADE)';

        ASSERT EXISTS (
            SELECT 1
            FROM pg_constraint c
                     JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
            WHERE c.conrelid = 'public.collectivite_levier_ges_pertinence'::regclass
              AND c.contype = 'f'
              AND c.confrelid = 'auth.users'::regclass
              AND a.attname = 'modified_by'
              AND c.confdeltype = 'n'
        ), 'La suppression d''un utilisateur doit garder la pertinence sans auteur (ON DELETE SET NULL)';

        ASSERT (
            SELECT relrowsecurity
            FROM pg_class
            WHERE oid = 'public.collectivite_levier_ges_pertinence'::regclass
        ), 'La table doit avoir la RLS activee';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'collectivite_levier_ges_pertinence'
        ), 'La table ne doit porter aucune policy : seul le backend y accede';
    END
$$;

ROLLBACK;
