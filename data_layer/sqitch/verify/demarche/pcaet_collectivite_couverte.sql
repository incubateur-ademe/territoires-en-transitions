-- Verify tet:demarche/pcaet_collectivite_couverte on pg

BEGIN;

SELECT demarche_id, collectivite_id, created_at, created_by
FROM public.demarche_pcaet_collectivite_couverte
WHERE false;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'demarche_pcaet_collectivite_couverte_check'
    ) THEN
        RAISE EXCEPTION 'le trigger de garde-fou manque';
    END IF;

    IF has_table_privilege('anon', 'public.demarche_pcaet_collectivite_couverte', 'SELECT')
    THEN
        RAISE EXCEPTION 'anon peut lire demarche_pcaet_collectivite_couverte';
    END IF;

    IF has_table_privilege('authenticated', 'public.demarche_pcaet_collectivite_couverte', 'SELECT')
    THEN
        RAISE EXCEPTION 'authenticated peut lire demarche_pcaet_collectivite_couverte';
    END IF;
END $$;

ROLLBACK;
