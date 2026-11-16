-- Verify tet:demarche/pcaet_supprime_services_demo on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.collectivite
        WHERE region_code IS NULL
          AND departement_code IS NULL
          AND (nom, type::text) IN (
              ('DREAL (démonstration)', 'dreal'),
              ('Région (démonstration)', 'region')
          )
    ) THEN
        RAISE EXCEPTION 'Un service de démo existe encore';
    END IF;
END $$;

ROLLBACK;
