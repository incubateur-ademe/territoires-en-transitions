-- Verify tet:plan_action/migrate_calendrier_to_description on pg

BEGIN;

-- Verify that calendrier column has been removed from fiche_action table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'fiche_action'
          AND column_name = 'calendrier'
    ) THEN
        RAISE EXCEPTION 'Column calendrier still exists in fiche_action table';
    END IF;
END $$;

-- Verify that calendrier column has been removed from historique.fiche_action table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'historique'
          AND table_name = 'fiche_action'
          AND column_name = 'calendrier'
    ) THEN
        RAISE EXCEPTION 'Column calendrier still exists in historique.fiche_action table';
    END IF;
END $$;

ROLLBACK;
