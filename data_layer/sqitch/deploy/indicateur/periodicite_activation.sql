-- Second release: activate cadences without migrating values again.
BEGIN;
ALTER TABLE public.indicateur_definition
    DROP CONSTRAINT indicateur_definition_annual_release,
    DROP CONSTRAINT indicateur_aggregation_annual_release;
ALTER TABLE public.indicateur_valeur
    DROP CONSTRAINT indicateur_valeur_annual_release;
COMMIT;
