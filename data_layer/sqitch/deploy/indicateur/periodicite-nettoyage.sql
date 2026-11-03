-- Deploy tet:indicateur/periodicite-nettoyage to pg
-- Fin de la période de retour arrière : suppression des objets temporaires.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL TIME ZONE 'UTC';
SET LOCAL DateStyle = 'ISO, YMD';
SET LOCAL extra_float_digits = 3;
SET LOCAL row_security = off;
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_definition IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN ACCESS EXCLUSIVE MODE;
LOCK TABLE private.indicateur_valeur_date_repair IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM sqitch.changes WHERE project = 'tet' AND change = 'indicateur/periodicite_activation') THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Déployer et valider l activation avant le nettoyage';
    END IF;
    IF EXISTS (SELECT FROM pg_constraint
        WHERE conrelid IN ('public.indicateur_definition'::regclass, 'public.indicateur_valeur'::regclass)
          AND conname IN ('indicateur_definition_schema_annuel', 'indicateur_valeur_schema_annuel')) THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Déployer et valider l activation avant le nettoyage';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_trigger
        WHERE tgrelid = 'public.indicateur_valeur'::regclass
          AND tgname = 'verifier_periodicite_valeur_indicateur' AND tgenabled = 'O') THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Le contrat de cadence des valeurs doit être actif';
    END IF;
    IF EXISTS (SELECT FROM public.indicateur_definition
               WHERE aggregation_resultat IS NOT NULL OR aggregation_objectif IS NOT NULL) THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Le nettoyage ne doit supprimer aucune donnée d agrégation';
    END IF;
END $$;

-- L’activation a conservé ces colonnes sous une contrainte NULL.
-- Leur suppression retire aussi cette contrainte devenue inutile.
ALTER TABLE public.indicateur_definition
    DROP COLUMN aggregation_resultat,
    DROP COLUMN aggregation_objectif;

-- Les observations actives, dont celles de Margny, restent inchangées.
-- Les images de réparation ne sont plus nécessaires au retour arrière.
DROP TABLE private.indicateur_valeur_date_repair;
COMMIT;
