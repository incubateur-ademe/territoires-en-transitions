-- Verify tet:shared/action_de_reference on pg

BEGIN;

DO
$$
    DECLARE
        unique_constraint_columns text;
        titre_check text;
        titre_longueur_check text;
        description_check text;
        trimmed_characters constant text := E' \t\n\u000B\f\r\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF';
    BEGIN
        ASSERT (
            SELECT is_nullable = 'NO' AND is_identity = 'YES' AND identity_generation = 'ALWAYS'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'action_de_reference'
              AND column_name = 'id'
        ), 'La colonne id doit etre generee par la base (GENERATED ALWAYS AS IDENTITY)';

        ASSERT (
            SELECT count(*) = 2
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'action_de_reference'
              AND column_name IN ('titre', 'description')
              AND is_nullable = 'NO'
              AND data_type = 'text'
        ), 'Les colonnes titre et description doivent etre NOT NULL et de type text';

        ASSERT (
            SELECT is_nullable = 'NO' AND udt_name = 'levier_ges_id'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'action_de_reference'
              AND column_name = 'levier'
        ), 'La colonne levier doit etre NOT NULL et de type levier_ges_id';

        ASSERT (
            SELECT is_nullable = 'NO' AND udt_name = 'volet_categorie'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'action_de_reference'
              AND column_name = 'categorie'
        ), 'La colonne categorie doit etre NOT NULL et de type volet_categorie';

        SELECT pg_get_constraintdef(oid) INTO titre_check
        FROM pg_constraint
        WHERE conrelid = 'public.action_de_reference'::regclass
          AND contype = 'c'
          AND conname = 'action_de_reference_titre_non_vide';

        ASSERT strpos(titre_check, 'titre <> ''''::text') > 0
                   AND strpos(titre_check, 'btrim(titre, ' || quote_literal(trimmed_characters) || '::text)') > 0,
            'Le CHECK action_de_reference_titre_non_vide doit refuser un titre vide ou entoure de blancs, or : '
                || coalesce(titre_check, 'contrainte absente');

        SELECT pg_get_constraintdef(oid) INTO titre_longueur_check
        FROM pg_constraint
        WHERE conrelid = 'public.action_de_reference'::regclass
          AND contype = 'c'
          AND conname = 'action_de_reference_titre_longueur_max';

        ASSERT titre_longueur_check = 'CHECK ((char_length(titre) <= 300))',
            'Le CHECK action_de_reference_titre_longueur_max doit borner le titre a 300 caracteres, or : '
                || coalesce(titre_longueur_check, 'contrainte absente');

        SELECT pg_get_constraintdef(oid) INTO description_check
        FROM pg_constraint
        WHERE conrelid = 'public.action_de_reference'::regclass
          AND contype = 'c'
          AND conname = 'action_de_reference_description_non_vide';

        ASSERT strpos(description_check, 'description <> ''''::text') > 0
                   AND strpos(description_check, 'btrim(description, ' || quote_literal(trimmed_characters) || '::text)') > 0,
            'Le CHECK action_de_reference_description_non_vide doit refuser une description vide ou entouree de blancs, or : '
                || coalesce(description_check, 'contrainte absente');

        SELECT string_agg(a.attname, ',' ORDER BY k.ord) INTO unique_constraint_columns
        FROM pg_constraint c
                 JOIN pg_index i ON i.indexrelid = c.conindid
                 CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        WHERE c.conrelid = 'public.action_de_reference'::regclass
          AND c.conname = 'action_de_reference_unique'
          AND c.contype = 'u'
          AND NOT c.condeferrable;

        ASSERT unique_constraint_columns = 'levier,categorie,titre',
            'La contrainte action_de_reference_unique doit porter sur (levier, categorie, titre) dans cet ordre, or : '
                || coalesce(unique_constraint_columns, 'contrainte absente ou DEFERRABLE');

        ASSERT (
            SELECT relrowsecurity
            FROM pg_class
            WHERE oid = 'public.action_de_reference'::regclass
        ), 'La table doit avoir la RLS activee';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'action_de_reference'
        ), 'La table ne doit porter aucune policy : seul le backend y accede';

        ASSERT NOT has_table_privilege('anon', 'public.action_de_reference', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE'),
            'anon ne doit avoir aucun droit sur action_de_reference : seul le backend y accede';

        ASSERT NOT has_table_privilege('authenticated', 'public.action_de_reference', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE'),
            'authenticated ne doit avoir aucun droit sur action_de_reference : seul le backend y accede';

        ASSERT NOT has_sequence_privilege('anon', 'public.action_de_reference_id_seq', 'USAGE, SELECT, UPDATE'),
            'anon ne doit avoir aucun droit sur la sequence de action_de_reference';

        ASSERT NOT has_sequence_privilege('authenticated', 'public.action_de_reference_id_seq', 'USAGE, SELECT, UPDATE'),
            'authenticated ne doit avoir aucun droit sur la sequence de action_de_reference';
    END
$$;

ROLLBACK;
