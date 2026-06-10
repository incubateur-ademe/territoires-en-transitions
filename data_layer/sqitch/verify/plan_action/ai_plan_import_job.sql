-- Verify tet:plan_action/ai_plan_import_job on pg

BEGIN;

DO $$
DECLARE
    status_check    text;
    fk_collectivite text;
    fk_created_by   text;
    index_predicate text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 11
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name IN (
              'id', 'collectivite_id', 'created_by', 'status', 'options',
              'step_states', 'source_path', 'draft', 'error',
              'created_at', 'modified_at'
          )
    ), 'La table ai_plan_import_job doit contenir les 11 colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name IN ('draft', 'error')
          AND is_nullable = 'YES'
    ), 'Les colonnes draft et error doivent être NULLABLE';

    ASSERT (
        SELECT COUNT(*) = 9
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND is_nullable = 'NO'
    ), 'Toutes les colonnes sauf draft et error doivent être NOT NULL';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name IN ('options', 'step_states')
          AND data_type = 'jsonb'
    ), 'Les colonnes options et step_states doivent être de type jsonb';

    SELECT cc.check_clause INTO status_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
        ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'ai_plan_import_job'
      AND ccu.column_name = 'status'
    LIMIT 1;

    ASSERT status_check IS NOT NULL,
        'La colonne status doit avoir une contrainte CHECK';
    ASSERT status_check LIKE '%''pending''%'
        AND status_check LIKE '%''running''%'
        AND status_check LIKE '%''done''%'
        AND status_check LIKE '%''failed''%',
        'La contrainte CHECK sur status doit autoriser exactement pending|running|done|failed';

    SELECT rc.delete_rule INTO fk_collectivite
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'ai_plan_import_job'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'collectivite_id'
    LIMIT 1;

    ASSERT fk_collectivite = 'CASCADE',
        'La FK collectivite_id doit avoir delete_rule = CASCADE';

    SELECT rc.delete_rule INTO fk_created_by
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'ai_plan_import_job'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'created_by'
    LIMIT 1;

    ASSERT fk_created_by = 'CASCADE',
        'La FK created_by doit avoir delete_rule = CASCADE';

    SELECT pg_get_expr(i.indpred, i.indrelid) INTO index_predicate
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'ai_plan_import_job_in_flight_unique';

    ASSERT index_predicate IS NOT NULL,
        'L''index unique partiel ai_plan_import_job_in_flight_unique doit exister';
    ASSERT index_predicate LIKE '%pending%'
        AND index_predicate LIKE '%running%',
        'L''index partiel doit être restreint aux statuts pending et running';
    ASSERT (
        SELECT i.indisunique
        FROM pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        WHERE c.relname = 'ai_plan_import_job_in_flight_unique'
    ), 'L''index ai_plan_import_job_in_flight_unique doit être UNIQUE';

    ASSERT (
        SELECT relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'ai_plan_import_job'
    ), 'RLS doit être activée sur ai_plan_import_job';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'ai_plan_import_job'
    ), 'ai_plan_import_job ne doit avoir aucune policy (RLS deny-by-default, accès service_role uniquement)';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM storage.buckets
        WHERE id = 'ai-plan-import-sources'
          AND public IS FALSE
    ), 'Le bucket privé ai-plan-import-sources doit exister';
END $$;

ROLLBACK;
