-- Verify that navigation_plans function has been removed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'navigation_plans'
        AND n.nspname = 'public'
    ) THEN
        RAISE EXCEPTION 'navigation_plans function still exists';
    END IF;
END $$; 