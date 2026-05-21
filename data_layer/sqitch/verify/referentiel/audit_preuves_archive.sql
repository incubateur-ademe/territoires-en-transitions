-- Verify tet:referentiel/audit_preuves_archive on pg

BEGIN;

DO $$
DECLARE
    check_clause       text;
    status_check       text;
    fk_collectivite    text;
    fk_audit           text;
    fk_requested_by    text;
    index_predicate    text;
BEGIN
    -- Table exists with the expected 13 columns
    ASSERT (
        SELECT COUNT(*) = 13
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_preuves_archive'
          AND column_name IN (
              'id', 'collectivite_id', 'referentiel_id', 'audit_id',
              'requested_by', 'status', 'total_files', 'processed_files',
              'storage_path', 'error_message', 'created_at', 'modified_at',
              'expires_at'
          )
    ), 'La table audit_preuves_archive doit contenir les 13 colonnes attendues';

    -- NOT NULL on every column except storage_path and error_message
    ASSERT (
        SELECT COUNT(*) = 11
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_preuves_archive'
          AND is_nullable = 'NO'
    ), 'Toutes les colonnes sauf storage_path et error_message doivent être NOT NULL';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_preuves_archive'
          AND column_name IN ('storage_path', 'error_message')
          AND is_nullable = 'YES'
    ), 'Les colonnes storage_path et error_message doivent être NULLABLE';

    -- CHECK constraint on status, with the exact 4 allowed values
    SELECT cc.check_clause INTO status_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
        ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'audit_preuves_archive'
      AND ccu.column_name = 'status'
    LIMIT 1;

    ASSERT status_check IS NOT NULL,
        'La colonne status doit avoir une contrainte CHECK';
    ASSERT status_check LIKE '%''pending''%'
        AND status_check LIKE '%''processing''%'
        AND status_check LIKE '%''completed''%'
        AND status_check LIKE '%''failed''%',
        'La contrainte CHECK sur status doit autoriser exactement pending|processing|completed|failed';

    -- Foreign keys with ON DELETE CASCADE
    SELECT rc.delete_rule INTO fk_collectivite
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'audit_preuves_archive'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'collectivite_id'
    LIMIT 1;

    ASSERT fk_collectivite = 'CASCADE',
        'La FK collectivite_id doit avoir delete_rule = CASCADE';

    SELECT rc.delete_rule INTO fk_audit
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'audit_preuves_archive'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'audit_id'
    LIMIT 1;

    ASSERT fk_audit = 'CASCADE',
        'La FK audit_id doit avoir delete_rule = CASCADE';

    SELECT rc.delete_rule INTO fk_requested_by
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'audit_preuves_archive'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'requested_by'
    LIMIT 1;

    ASSERT fk_requested_by = 'CASCADE',
        'La FK requested_by doit avoir delete_rule = CASCADE';

    -- Partial unique index on (audit_id, requested_by) WHERE status in-flight
    SELECT pg_get_expr(i.indpred, i.indrelid) INTO index_predicate
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'audit_preuves_archive_in_flight_unique';

    ASSERT index_predicate IS NOT NULL,
        'L''index unique partiel audit_preuves_archive_in_flight_unique doit exister';
    ASSERT index_predicate LIKE '%pending%'
        AND index_predicate LIKE '%processing%',
        'L''index partiel doit être restreint aux statuts pending et processing';
    ASSERT (
        SELECT i.indisunique
        FROM pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        WHERE c.relname = 'audit_preuves_archive_in_flight_unique'
    ), 'L''index audit_preuves_archive_in_flight_unique doit être UNIQUE';

    -- RLS is enabled
    ASSERT (
        SELECT relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'audit_preuves_archive'
    ), 'RLS doit être activée sur audit_preuves_archive';

    -- No policies defined (deny-by-default for non-service_role)
    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'audit_preuves_archive'
    ), 'audit_preuves_archive ne doit avoir aucune policy (RLS deny-by-default, accès via service_role uniquement)';

    -- Bucket privé dédié aux archives de preuves
    ASSERT (
        SELECT COUNT(*) = 1
        FROM storage.buckets
        WHERE id = 'preuves-archives'
          AND public IS FALSE
    ), 'Le bucket privé preuves-archives doit exister';
END $$;

ROLLBACK;
