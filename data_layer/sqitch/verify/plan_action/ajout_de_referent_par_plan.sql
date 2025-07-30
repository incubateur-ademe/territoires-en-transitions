-- Verify tet:ajout_de_referent_par_plan on pg

BEGIN;

-- Verify the plan_referent table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'plan_referent'
    ) THEN
        RAISE EXCEPTION 'Table plan_referent does not exist';
    END IF;
END $$;

-- Verify the unique index exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'plan_referent_axe_id_user_id_tag_id_key'
    ) THEN
        RAISE EXCEPTION 'Unique index plan_referent_axe_id_user_id_tag_id_key does not exist';
    END IF;
END $$;

-- Verify foreign key constraints exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'plan_referent_plan_id_fkey'
        AND table_name = 'plan_referent'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint plan_referent_plan_id_fkey does not exist';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'plan_referent_tag_id_fkey'
        AND table_name = 'plan_referent'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint plan_referent_tag_id_fkey does not exist';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'plan_referent_user_id_fkey'
        AND table_name = 'plan_referent'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint plan_referent_user_id_fkey does not exist';
    END IF;
END $$;

-- Verify the function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'private' 
        AND routine_name = 'axe_collectivite_id'
    ) THEN
        RAISE EXCEPTION 'Function private.axe_collectivite_id does not exist';
    END IF;
END $$;

ROLLBACK; 