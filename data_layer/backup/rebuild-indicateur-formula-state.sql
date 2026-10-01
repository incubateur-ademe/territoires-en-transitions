\set ON_ERROR_STOP on

BEGIN;

-- Même ordre de verrouillage que les mutations du graphe et les migrations.
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Les triggers USER étaient coupés pendant le chargement. La projection est
-- dérivée du catalogue restauré ; la file durable de recalcul reste intacte.
TRUNCATE private.indicateur_definition_dependance_calcul;
INSERT INTO private.indicateur_definition_dependance_calcul
    (indicateur_id, source_identifiant)
SELECT definition.id, dependance.source_identifiant
FROM public.indicateur_definition definition
CROSS JOIN LATERAL private.extraire_dependances_formule_indicateur(
    definition.valeur_calcule
) AS dependance
WHERE definition.valeur_calcule IS NOT NULL
  AND btrim(definition.valeur_calcule) <> '';

SELECT private.verifier_periodicite_dependances_formule();
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM public.indicateur_valeur valeur
        WHERE valeur.date_valeur <> public.indicateur_date_debut_periode(
            valeur.periodicite, valeur.date_valeur
        )
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Le snapshot contient une date d indicateur non canonique';
    END IF;
END $$;

COMMIT;
