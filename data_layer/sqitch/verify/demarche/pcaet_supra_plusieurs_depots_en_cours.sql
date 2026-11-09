-- Verify tet:demarche/pcaet_supra_plusieurs_depots_en_cours on pg

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.demarche_active_unique') IS NOT NULL THEN
        RAISE EXCEPTION 'demarche_active_unique existe encore';
    END IF;
END $$;

ROLLBACK;
