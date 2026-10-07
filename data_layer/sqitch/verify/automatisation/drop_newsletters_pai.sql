-- Verify tet:automatisation/drop_newsletters_pai on pg

BEGIN;

DO $$
BEGIN
    IF to_regproc('automatisation.send_user_newsletters_new_pai') IS NOT NULL
    THEN
        RAISE EXCEPTION 'La fonction send_user_newsletters_new_pai existe encore';
    END IF;

    IF EXISTS(SELECT FROM pg_trigger WHERE tgname = 'after_upsert_from_panier_send_user')
    THEN
        RAISE EXCEPTION 'Le trigger after_upsert_from_panier_send_user existe encore';
    END IF;
END $$;

ROLLBACK;
