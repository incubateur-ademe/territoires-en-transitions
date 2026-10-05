\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Restore disables USER triggers. Rebuild derived dependencies from the restored
-- definitions, without modifying observations or durable recalculation jobs.
DO $$
BEGIN
    IF to_regclass('private.indicateur_definition_dependance_calcul') IS NULL THEN
        RETURN; -- The releases before cadence activation have no projection.
    END IF;

    TRUNCATE private.indicateur_definition_dependance_calcul;
    INSERT INTO private.indicateur_definition_dependance_calcul
        (indicateur_id, source_identifiant)
    SELECT definition.id, dependance.source_identifiant
    FROM public.indicateur_definition definition
    CROSS JOIN LATERAL private.extraire_dependances_formule_indicateur(
        definition.valeur_calcule
    ) AS dependance;
    PERFORM private.verifier_periodicite_dependances_formule();

END $$;
COMMIT;
