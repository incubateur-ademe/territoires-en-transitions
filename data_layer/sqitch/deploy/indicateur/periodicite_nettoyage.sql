-- Deploy tet:indicateur/periodicite_nettoyage to pg
-- La fenêtre de retour arrière est close. Conserver la sauvegarde complète
-- prise avant ce déploiement : les anciens états ne seront pas recréés.
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
    IF NOT EXISTS (SELECT FROM sqitch.changes WHERE project = 'tet' AND change = 'indicateur/margny_indicateurs_mensuels') THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Déployer et valider la migration de Margny avant le nettoyage';
    END IF;
    IF EXISTS (SELECT FROM pg_constraint
        WHERE conrelid IN ('public.indicateur_definition'::regclass, 'public.indicateur_valeur'::regclass)
          AND conname IN ('indicateur_definition_schema_annuel', 'indicateur_valeur_schema_annuel',
                         'indicateur_definition_annual_release', 'indicateur_aggregation_annual_release',
                         'indicateur_valeur_annual_release')) THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Déployer et valider l activation avant le nettoyage';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_trigger
        WHERE tgrelid = 'public.indicateur_valeur'::regclass
          AND tgname = 'verifier_date_valeur_selon_periodicite' AND tgenabled = 'O') THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Le contrat final de dates doit être actif';
    END IF;
    IF EXISTS (SELECT FROM migration.indicateur_valeur_periodicite_audit WHERE statut = 'conflit') THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Les conflits historiques doivent être résolus avant le nettoyage';
    END IF;
END $$;

DROP TRIGGER assainir_audit_periodicite_indicateur ON public.indicateur_valeur;
DROP FUNCTION migration.assainir_audit_periodicite_indicateur();
DROP TABLE migration.indicateur_valeur_periodicite_audit;
DROP TABLE private.indicateur_valeur_write_acl;
DROP TABLE private.indicateur_valeur_date_repair;
DROP FUNCTION migration.verifier_retrait_periodicite_indicateur();

-- La migration métier précédente est distincte : aucune observation n'est réécrite.
-- L'archive de réparation n'a plus de fonction après fermeture du retour arrière.
COMMIT;
