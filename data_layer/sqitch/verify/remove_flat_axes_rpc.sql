-- Verify that flat_axes function has been removed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'flat_axes'
        AND n.nspname = 'public'
    ) THEN
        RAISE EXCEPTION 'flat_axes function still exists';
    END IF;
END $$; 