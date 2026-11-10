-- Verify tet:demarche/pcaet_services_demo on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT count(*)
        FROM public.collectivite
        WHERE (nom, type) IN (('DREAL (démonstration)', 'dreal'),
                              ('Région (démonstration)', 'region'))
          AND region_code IS NULL
          AND departement_code IS NULL
    ) = 2,
        'Les deux services instructeurs de démonstration doivent exister, sans territoire';
END $$;

ROLLBACK;
