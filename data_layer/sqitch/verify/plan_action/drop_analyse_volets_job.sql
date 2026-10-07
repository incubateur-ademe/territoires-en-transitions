-- Verify tet:plan_action/drop_analyse_volets_job on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT to_regclass('public.analyse_volets_job') IS NULL,
            'La table analyse_volets_job doit etre supprimee : le passage d analyse n a plus de job';
    END
$$;

ROLLBACK;
