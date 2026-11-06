-- Verify tet:labellisation/drop_update_labellisation_trigger on pg

BEGIN;

DO $$
BEGIN
    ASSERT NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_labellisation_before_audit_update'
    ), 'Le trigger update_labellisation_before_audit_update doit être supprimé';
    ASSERT NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'retool_update_audit'
    ), 'La fonction retool_update_audit doit être supprimée';
END $$;

ROLLBACK;
