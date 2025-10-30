-- Verify tet:collectivite/rename_commentaire_to_discussion on pg

BEGIN;

-- Verify the new table names exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'discussion'
    ) THEN
        RAISE EXCEPTION 'Table discussion does not exist';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'discussion_message'
    ) THEN
        RAISE EXCEPTION 'Table discussion_message does not exist';
    END IF;
END $$;

-- Verify the old table names do NOT exist
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'action_discussion'
    ) THEN
        RAISE EXCEPTION 'Old table action_discussion still exists';
    END IF;

    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'action_discussion_commentaire'
    ) THEN
        RAISE EXCEPTION 'Old table action_discussion_commentaire still exists';
    END IF;
END $$;

ROLLBACK;
