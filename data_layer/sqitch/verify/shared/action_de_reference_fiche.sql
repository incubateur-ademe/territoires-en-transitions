-- Verify tet:shared/action_de_reference_fiche on pg

BEGIN;

DO
$$
    DECLARE
        primary_key_columns text;
    BEGIN
        ASSERT (
            SELECT count(*) = 2
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'action_de_reference_fiche'
              AND column_name IN ('action_de_reference_id', 'fiche_id')
              AND is_nullable = 'NO'
              AND data_type = 'integer'
        ), 'Les colonnes action_de_reference_id et fiche_id doivent etre NOT NULL et de type integer';

        SELECT string_agg(a.attname, ',' ORDER BY k.ord) INTO primary_key_columns
        FROM pg_constraint c
                 JOIN pg_index i ON i.indexrelid = c.conindid
                 CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        WHERE c.conrelid = 'public.action_de_reference_fiche'::regclass
          AND c.contype = 'p';

        ASSERT primary_key_columns = 'action_de_reference_id,fiche_id',
            'La cle primaire doit porter sur (action_de_reference_id, fiche_id) dans cet ordre, or : '
                || coalesce(primary_key_columns, 'cle primaire absente');

        ASSERT (
            SELECT count(*) = 2
            FROM pg_constraint
            WHERE conrelid = 'public.action_de_reference_fiche'::regclass
              AND contype = 'f'
              AND confdeltype = 'c'
        ), 'Les deux cles etrangeres doivent supprimer le lien en cascade';

        ASSERT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename = 'action_de_reference_fiche'
              AND indexname = 'action_de_reference_fiche_fiche_id_idx'
        ), 'L index sur fiche_id doit exister';

        ASSERT (
            SELECT relrowsecurity
            FROM pg_class
            WHERE oid = 'public.action_de_reference_fiche'::regclass
        ), 'La table doit avoir la RLS activee';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'action_de_reference_fiche'
        ), 'La table ne doit porter aucune policy : seul le backend y accede';

        ASSERT NOT has_table_privilege('anon', 'public.action_de_reference_fiche', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE'),
            'anon ne doit avoir aucun droit sur action_de_reference_fiche : seul le backend y accede';

        ASSERT NOT has_table_privilege('authenticated', 'public.action_de_reference_fiche', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE'),
            'authenticated ne doit avoir aucun droit sur action_de_reference_fiche : seul le backend y accede';
    END
$$;

ROLLBACK;
