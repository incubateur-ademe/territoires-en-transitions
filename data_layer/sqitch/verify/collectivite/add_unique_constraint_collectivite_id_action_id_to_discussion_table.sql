-- Verify tet:collectivite/add_unique_constraint_collectivite_id_action_id_to_discussion_table on pg

BEGIN;

-- Verify the unique index exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_indexes
        WHERE indexname = 'discussion_collectivite_id_action_id_key'
    ) THEN
        RAISE EXCEPTION 'Unique index discussion_collectivite_id_action_id_key does not exist';
    END IF;
END $$;

ROLLBACK;
