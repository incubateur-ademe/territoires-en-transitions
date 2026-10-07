-- Verify tet:collectivite/drop_mes_collectivites on pg

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.mes_collectivites') IS NOT NULL
    THEN
        RAISE EXCEPTION 'La vue mes_collectivites existe encore';
    END IF;
END $$;

ROLLBACK;
