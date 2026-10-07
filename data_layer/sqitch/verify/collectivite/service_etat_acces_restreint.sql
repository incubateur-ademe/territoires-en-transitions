-- Verify tet:collectivite/service_etat_acces_restreint on pg

BEGIN;

DO $$
DECLARE
    ouverts integer;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgrelid = 'public.collectivite'::regclass
          AND tgname = 'collectivite_service_deconcentre_est_restreint'
    ) THEN
        RAISE EXCEPTION 'le trigger collectivite_service_deconcentre_est_restreint manque';
    END IF;

    -- Vaut sur une base vide (aucun service, donc aucun ouvert) comme sur une
    -- base peuplée.
    SELECT count(*) INTO ouverts
    FROM public.collectivite
    WHERE type IN ('dreal', 'ddt', 'dr_ademe', 'service_national')
      AND access_restreint IS DISTINCT FROM true;

    IF ouverts > 0 THEN
        RAISE EXCEPTION '% service(s) déconcentré(s) restent hors accès restreint', ouverts;
    END IF;
END $$;

ROLLBACK;
