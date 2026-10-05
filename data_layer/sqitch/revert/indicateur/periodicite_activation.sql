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

-- Restaure le schéma de préparation publié avec des règles laissées à NULL.
-- Refuse atomiquement le retour annuel si une autre périodicité est utilisée.
-- Ces contraintes restent actives pendant les reverts suivants.
ALTER TABLE public.indicateur_definition
    ADD COLUMN aggregation_resultat text CHECK (
        aggregation_resultat IN ('somme', 'moyenne', 'derniere_valeur')
    ),
    ADD COLUMN aggregation_objectif text CHECK (
        aggregation_objectif IN ('somme', 'moyenne', 'derniere_valeur')
    ),
    ADD CONSTRAINT indicateur_definition_schema_annuel CHECK (
        periodicite IS NOT DISTINCT FROM 'annuelle'
        AND aggregation_resultat IS NULL AND aggregation_objectif IS NULL
    );
ALTER TABLE public.indicateur_valeur
    ADD CONSTRAINT indicateur_valeur_schema_annuel CHECK (periodicite = 'annuelle');

DROP TRIGGER verifier_periodicite_valeur_indicateur ON public.indicateur_valeur;
DROP FUNCTION public.verifier_periodicite_valeur_indicateur();
DROP TRIGGER empecher_changement_periodicite_indicateur ON public.indicateur_definition;
DROP FUNCTION public.empecher_changement_periodicite_indicateur();
DROP TRIGGER verifier_periodicite_groupe_indicateur ON public.indicateur_groupe;
DROP FUNCTION public.verifier_periodicite_groupe_indicateur();
COMMENT ON COLUMN public.indicateur_definition.periodicite IS
    'Cadence de déclaration, référencée dans public.indicateur_periodicite.';
COMMIT;
