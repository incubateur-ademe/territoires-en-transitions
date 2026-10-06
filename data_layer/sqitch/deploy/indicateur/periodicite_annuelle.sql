-- First release: migrate storage while keeping all writers annual.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
ALTER TABLE public.indicateur_definition
    ADD CONSTRAINT indicateur_definition_annual_release CHECK (periodicite = 'annuelle'),
    ADD CONSTRAINT indicateur_aggregation_annual_release CHECK (
        aggregation_resultat IS NULL AND aggregation_objectif IS NULL
    );
ALTER TABLE public.indicateur_valeur
    ADD CONSTRAINT indicateur_valeur_annual_release CHECK (periodicite = 'annuelle');
COMMIT;
