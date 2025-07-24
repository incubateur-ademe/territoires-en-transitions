-- Verify tet:ajout_de_pilote_par_plan on pg

BEGIN;

-- Verify the plan_pilote table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'plan_pilote'
    ) THEN
        RAISE EXCEPTION 'Table plan_pilote does not exist';
    END IF;
END $$;

-- Verify the unique index exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'plan_pilote_axe_id_user_id_tag_id_key'
    ) THEN
        RAISE EXCEPTION 'Unique index plan_pilote_axe_id_user_id_tag_id_key does not exist';
    END IF;
END $$;

-- Verify foreign key constraints exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'plan_pilote_plan_id_fkey'
        AND table_name = 'plan_pilote'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint plan_pilote_plan_id_fkey does not exist';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'plan_pilote_tag_id_fkey'
        AND table_name = 'plan_pilote'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint plan_pilote_tag_id_fkey does not exist';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'plan_pilote_user_id_fkey'
        AND table_name = 'plan_pilote'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint plan_pilote_user_id_fkey does not exist';
    END IF;
END $$;

-- Verify RLS policies exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'plan_pilote' 
        AND policyname = 'allow_insert'
    ) THEN
        RAISE EXCEPTION 'RLS policy allow_insert does not exist on plan_pilote';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'plan_pilote' 
        AND policyname = 'allow_read'
    ) THEN
        RAISE EXCEPTION 'RLS policy allow_read does not exist on plan_pilote';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'plan_pilote' 
        AND policyname = 'allow_update'
    ) THEN
        RAISE EXCEPTION 'RLS policy allow_update does not exist on plan_pilote';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'plan_pilote' 
        AND policyname = 'allow_delete'
    ) THEN
        RAISE EXCEPTION 'RLS policy allow_delete does not exist on plan_pilote';
    END IF;
END $$;

ROLLBACK; 