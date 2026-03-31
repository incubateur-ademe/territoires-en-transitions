-- Verify tet:referentiel/drop-action-historique-triggers on pg

BEGIN;

DO $$
BEGIN
    -- Verify trigger save_history on action_statut is dropped
    IF EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'save_history' AND c.relname = 'action_statut'
    ) THEN
        RAISE EXCEPTION 'Le trigger save_history existe encore sur action_statut';
    END IF;

    -- Verify trigger save_history on action_commentaire is dropped
    IF EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'save_history' AND c.relname = 'action_commentaire'
    ) THEN
        RAISE EXCEPTION 'Le trigger save_history existe encore sur action_commentaire';
    END IF;

    -- Verify function historique.save_action_statut is dropped
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'save_action_statut' AND n.nspname = 'historique'
    ) THEN
        RAISE EXCEPTION 'La fonction historique.save_action_statut() existe encore';
    END IF;

    -- Verify function historique.save_action_precision is dropped
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'save_action_precision' AND n.nspname = 'historique'
    ) THEN
        RAISE EXCEPTION 'La fonction historique.save_action_precision() existe encore';
    END IF;

    -- Verify function private.move_action_data is dropped
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'move_action_data' AND n.nspname = 'private'
    ) THEN
        RAISE EXCEPTION 'La fonction private.move_action_data() existe encore';
    END IF;
END $$;

ROLLBACK;
