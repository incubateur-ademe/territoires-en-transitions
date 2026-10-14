-- Revert tet:indicateur/periodicite_activation from pg
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Restaure les CHECK du socle ; toute donnée non annuelle fait échouer le revert.
ALTER TABLE public.indicateur_definition
    DROP CONSTRAINT indicateur_definition_periodicite_check,
    ADD CONSTRAINT indicateur_definition_periodicite_check CHECK (periodicite = 'annuelle');
ALTER TABLE public.indicateur_valeur
    DROP CONSTRAINT indicateur_valeur_periodicite_check,
    ADD CONSTRAINT indicateur_valeur_periodicite_check CHECK (periodicite = 'annuelle');

-- Restaure le garde-fou annuel ; les colonnes inutilisées sont restées à NULL.
-- Refuse atomiquement le retour annuel si une autre périodicité est utilisée.
-- Ces contraintes restent actives pendant les reverts suivants.
ALTER TABLE public.indicateur_definition
    DROP CONSTRAINT indicateur_definition_sans_aggregation,
    ADD CONSTRAINT indicateur_definition_schema_annuel CHECK (
        periodicite IS NOT DISTINCT FROM 'annuelle'
        AND aggregation_resultat IS NULL AND aggregation_objectif IS NULL
    );
ALTER TABLE public.indicateur_valeur
    ADD CONSTRAINT indicateur_valeur_schema_annuel CHECK (periodicite = 'annuelle');

-- La préparation d’intégrité annuelle reste installée après ce retour arrière.
COMMIT;
