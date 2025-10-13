-- Verify tet:collectivite/remove_supprimer_commentaire_via_table_trigger on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name = 'supprimer_commentaire_via_table'
        AND event_object_table = 'discussion_message'
    ) THEN
        RAISE EXCEPTION 'Trigger supprimer_commentaire_via_table still exists on discussion_message table';
    END IF;
END $$;

ROLLBACK;
