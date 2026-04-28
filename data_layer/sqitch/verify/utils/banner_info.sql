-- Verify tet:utils/banner_info on pg

BEGIN;

DO $$
DECLARE
    fk_delete_rule    text;
    check_clause      text;
    id_check_clause   text;
BEGIN
    -- Table exists with the expected columns
    ASSERT (
        SELECT COUNT(*) = 6
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'banner_info'
          AND column_name IN ('id', 'type', 'info', 'modified_at', 'modified_by', 'active')
    ), 'La table banner_info doit contenir les 6 colonnes attendues';

    -- NOT NULL on id, type, info, modified_at, active (modified_by is nullable on purpose)
    ASSERT (
        SELECT COUNT(*) = 5
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'banner_info'
          AND column_name IN ('id', 'type', 'info', 'modified_at', 'active')
          AND is_nullable = 'NO'
    ), 'Les colonnes id, type, info, modified_at, active doivent être NOT NULL';

    ASSERT (
        SELECT is_nullable = 'YES'
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'banner_info'
          AND column_name = 'modified_by'
    ), 'La colonne modified_by doit être NULLABLE';

    -- Defaults: id=1, info='', modified_at=now(), active=false
    ASSERT (
        SELECT column_default = '1'
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'banner_info'
          AND column_name = 'id'
    ), 'La colonne id doit avoir un DEFAULT 1';

    ASSERT (
        SELECT column_default LIKE '%''''::text%'
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'banner_info'
          AND column_name = 'info'
    ), 'La colonne info doit avoir un DEFAULT vide';

    ASSERT (
        SELECT column_default = 'false'
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'banner_info'
          AND column_name = 'active'
    ), 'La colonne active doit avoir un DEFAULT false';

    -- CHECK constraint on type, with the exact 4 allowed values
    SELECT cc.check_clause INTO check_clause
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
        ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'banner_info'
      AND ccu.column_name = 'type'
    LIMIT 1;

    ASSERT check_clause IS NOT NULL,
        'La colonne banner_info.type doit avoir une contrainte CHECK';
    ASSERT check_clause LIKE '%''info''%'
        AND check_clause LIKE '%''warning''%'
        AND check_clause LIKE '%''error''%'
        AND check_clause LIKE '%''event''%',
        'La contrainte CHECK sur type doit autoriser exactement info|warning|error|event';

    -- CHECK constraint on id (singleton invariant: id MUST equal 1)
    SELECT cc.check_clause INTO id_check_clause
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
        ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'banner_info'
      AND ccu.column_name = 'id'
    LIMIT 1;

    ASSERT id_check_clause IS NOT NULL,
        'La colonne banner_info.id doit avoir une contrainte CHECK (singleton)';
    ASSERT id_check_clause LIKE '%= 1%' OR id_check_clause LIKE '%=1%',
        'La contrainte CHECK sur id doit imposer id = 1';

    -- Foreign key on modified_by: ON DELETE SET NULL, points at public.dcp(user_id)
    SELECT rc.delete_rule INTO fk_delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'banner_info'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'modified_by'
    LIMIT 1;

    ASSERT fk_delete_rule = 'SET NULL',
        'La FK modified_by doit avoir delete_rule = SET NULL';

    -- RLS is enabled
    ASSERT (
        SELECT relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'banner_info'
    ), 'RLS doit être activée sur banner_info';

    -- No policies defined (deny-by-default for non-service_role)
    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'banner_info'
    ), 'banner_info ne doit avoir aucune policy (RLS deny-by-default, accès via service_role uniquement)';
END $$;

ROLLBACK;
