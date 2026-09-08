-- Verify tet:plan_action/classification_leviers_job on pg

BEGIN;

DO $$
DECLARE
    status_check    text;
    fk_plan         text;
    index_predicate text;
    index_column    text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 12
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'classification_leviers_job'
          AND column_name IN (
              'id', 'collectivite_id', 'plan_id', 'created_by', 'status',
              'processed_batches', 'total_batches', 'draft', 'token_usage', 'error',
              'created_at', 'modified_at'
          )
    ), 'La table classification_leviers_job doit contenir les 12 colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 3
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'classification_leviers_job'
          AND column_name IN ('draft', 'token_usage', 'error')
          AND is_nullable = 'YES'
    ), 'Les colonnes draft, token_usage et error doivent être NULLABLE';

    ASSERT (
        SELECT COUNT(*) = 9
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'classification_leviers_job'
          AND is_nullable = 'NO'
    ), 'Toutes les colonnes sauf draft, token_usage et error doivent être NOT NULL';

    SELECT cc.check_clause INTO status_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
        ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'classification_leviers_job'
      AND ccu.column_name = 'status'
    LIMIT 1;

    ASSERT status_check IS NOT NULL,
        'La colonne status doit avoir une contrainte CHECK';
    ASSERT status_check LIKE '%''pending''%'
        AND status_check LIKE '%''running''%'
        AND status_check LIKE '%''done''%'
        AND status_check LIKE '%''failed''%',
        'La contrainte CHECK sur status doit autoriser exactement pending|running|done|failed';

    SELECT rc.delete_rule INTO fk_plan
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'classification_leviers_job'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'plan_id'
    LIMIT 1;

    ASSERT fk_plan = 'CASCADE',
        'La FK plan_id doit avoir delete_rule = CASCADE';

    SELECT pg_get_expr(i.indpred, i.indrelid) INTO index_predicate
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'classification_leviers_job_in_flight_unique';

    ASSERT index_predicate IS NOT NULL,
        'L''index unique partiel classification_leviers_job_in_flight_unique doit exister';
    ASSERT index_predicate LIKE '%pending%'
        AND index_predicate LIKE '%running%',
        'L''index partiel doit être restreint aux statuts pending et running';
    ASSERT (
        SELECT i.indisunique
        FROM pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        WHERE c.relname = 'classification_leviers_job_in_flight_unique'
    ), 'L''index classification_leviers_job_in_flight_unique doit être UNIQUE';

    SELECT a.attname INTO index_column
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
    WHERE c.relname = 'classification_leviers_job_in_flight_unique';

    ASSERT index_column = 'plan_id',
        'L''index partiel doit porter sur plan_id, et non sur collectivite_id : un job en vol borne un plan, pas une collectivité';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            USING (constraint_schema, constraint_name)
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'classification_leviers_job'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name IN ('collectivite_id', 'created_by')
    ), 'Les FK collectivite_id et created_by doivent exister';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'classification_leviers_job'
          AND column_name IN ('draft', 'token_usage')
          AND data_type = 'jsonb'
    ), 'Les colonnes draft et token_usage doivent être de type jsonb';

    ASSERT (
        SELECT relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'classification_leviers_job'
    ), 'RLS doit être activée sur classification_leviers_job';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'classification_leviers_job'
    ), 'classification_leviers_job ne doit avoir aucune policy (RLS deny-by-default, accès service_role uniquement)';
END $$;

ROLLBACK;
