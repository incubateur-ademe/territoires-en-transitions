\set ON_ERROR_STOP on

BEGIN;

-- Les services et les triggers du graphe prennent ce verrou avant celui de la
-- table. La restauration reconstruit ainsi sa projection sur un catalogue
-- immobile, selon le même ordre que le contract Sqitch.
SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

DO $rebuild$
DECLARE
    projection_exists boolean := to_regclass(
        'private.indicateur_definition_dependance_calcul'
    ) IS NOT NULL;
    verifier_exists boolean := to_regprocedure(
        'private.verifier_periodicite_dependances_formule(integer,text[])'
    ) IS NOT NULL;
    extractor_exists boolean := to_regprocedure(
        'private.extraire_dependances_formule_indicateur(text)'
    ) IS NOT NULL;
    audit_exists boolean := to_regclass(
        'migration.indicateur_valeur_periodicite_audit'
    ) IS NOT NULL;
    audit_function_exists boolean := to_regprocedure(
        'migration.auditer_et_normaliser_dates_indicateur()'
    ) IS NOT NULL;
    contract_applied boolean := projection_exists;
BEGIN
    IF projection_exists IS DISTINCT FROM verifier_exists
       OR (projection_exists AND NOT extractor_exists) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'État contractuel partiel : impossible de reconstruire les dépendances de formule';
    END IF;

    IF projection_exists THEN
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

        -- Cette validation appartient à la même transaction que le rebuild :
        -- une formule inconnue ou inter-périodicité annule toute la projection.
        PERFORM private.verifier_periodicite_dependances_formule();
    END IF;

    IF projection_exists AND NOT audit_exists THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'État contractuel partiel : l audit de périodicité manque';
    ELSIF NOT projection_exists AND extractor_exists
          AND (NOT audit_exists OR NOT audit_function_exists) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'État expand partiel : impossible de rejouer l audit de périodicité';
    ELSIF NOT projection_exists AND NOT extractor_exists
          AND (audit_exists OR audit_function_exists) THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'État legacy incohérent : objets d audit de périodicité inattendus';
    END IF;

    IF NOT projection_exists AND extractor_exists THEN
        -- Le snapshot restaure l'historique nécessaire au downgrade. Le rejeu
        -- retire ses lignes obsolètes et audite toute valeur chargée sans que
        -- les triggers de transition aient été exécutés par pg_restore.
        ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_at;
        ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_by;
        PERFORM migration.auditer_et_normaliser_dates_indicateur();
        ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_by;
        ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_at;
    END IF;

    -- En phase contract la fonction d'audit transitoire a été retirée. Les
    -- lignes d'audit restaurées appartiennent déjà au snapshot source ; on les
    -- préserve et on valide directement l'invariant strict des dates.
    IF contract_applied AND EXISTS (
        SELECT 1
        FROM public.indicateur_valeur valeur
        JOIN public.indicateur_definition definition
          ON definition.id = valeur.indicateur_id
        WHERE valeur.date_valeur <> public.indicateur_date_debut_periode(
            definition.periodicite,
            valeur.date_valeur
        )
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Le snapshot contractuel contient une date d indicateur non canonique';
    END IF;
END
$rebuild$;

COMMIT;
