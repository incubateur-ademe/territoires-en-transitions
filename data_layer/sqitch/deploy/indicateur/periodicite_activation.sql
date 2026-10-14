-- Deploy tet:indicateur/periodicite_activation to pg
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Le socle annuel fournit ces CHECK ; seule cette migration ouvre les autres cadences.
ALTER TABLE public.indicateur_definition
    DROP CONSTRAINT indicateur_definition_periodicite_check,
    ADD CONSTRAINT indicateur_definition_periodicite_check CHECK (periodicite IN ('annuelle', 'semestrielle', 'trimestrielle', 'mensuelle'));
ALTER TABLE public.indicateur_valeur
    DROP CONSTRAINT indicateur_valeur_periodicite_check,
    ADD CONSTRAINT indicateur_valeur_periodicite_check CHECK (periodicite IN ('annuelle', 'semestrielle', 'trimestrielle', 'mensuelle'));

-- Les règles sont déjà installées par periodicite_integrite.
ALTER TABLE public.indicateur_definition
    DROP CONSTRAINT indicateur_definition_schema_annuel,
    -- Les colonnes inutilisées restent fermées jusqu’à leur suppression en #5296.
    ADD CONSTRAINT indicateur_definition_sans_aggregation CHECK (
        aggregation_resultat IS NULL AND aggregation_objectif IS NULL
    );
ALTER TABLE public.indicateur_valeur
    DROP CONSTRAINT indicateur_valeur_schema_annuel;
COMMIT;
