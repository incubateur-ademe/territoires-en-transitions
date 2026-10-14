BEGIN;

SELECT plan(20);

SELECT has_function(
    'private',
    'verifier_periodicite_dependances_formule',
    ARRAY['integer', 'text[]'],
    'La base vérifie les dépendances depuis les formules'
);

SELECT set_eq(
    $$
        SELECT source_identifiant
        FROM private.extraire_dependances_formule_indicateur(
            'val(Test-Formule-Source) + opt_val(test-formule-source, citepa) + cible(test.formule.cible) + limite(test-formule-limite)'
            || ' + EST_SUIVI(test-formule-suivi) + PROGRESSION_SNBC(test-formule-progression, 2019)'
            || ' + REDUCTION(test-formule-reduction, 2019, 2030, 40)'
        )
    $$,
    $$ VALUES
        ('test-formule-limite'::text),
        ('test-formule-source'::text),
        ('test-formule-suivi'::text),
        ('test-formule-progression'::text),
        ('test-formule-reduction'::text),
        ('test.formule.cible'::text)
    $$,
    'L extraction suit les sept appels de la grammaire, normalise la casse et déduplique'
);

CREATE TEMPORARY TABLE test_indicateur_periodicite_formule AS
WITH definitions AS (
    INSERT INTO public.indicateur_definition
        (identifiant_referentiel, titre, unite, periodicite)
    VALUES
        ('test-formule-source-annuelle', 'Source annuelle de formule', 'kWh', 'annuelle'),
        ('Test-Formule-Source-Secondaire', 'Source secondaire de formule', 'kWh', 'annuelle'),
        ('test-formule-cible', 'Cible de formule', 'kWh', 'annuelle')
    RETURNING id, identifiant_referentiel
)
SELECT id, identifiant_referentiel
FROM definitions;

SELECT lives_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule =
            'val(test-formule-source-annuelle) + opt_val(test-formule-source-annuelle, citepa)'
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    'Une formule dont les dépendances ont la même périodicité est acceptée'
);

SELECT results_eq(
    $$
        SELECT valeur_calcule
        FROM public.indicateur_definition
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    $$ VALUES ('val(test-formule-source-annuelle) + opt_val(test-formule-source-annuelle, citepa)'::text) $$,
    'La formule acceptée est enregistrée sans transformation'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule = 'val(test-formule-source-inconnue)'
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    23503,
    NULL,
    'Une formule ne peut pas référencer une définition absente'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule = 'EST_SUIVI(test-formule-source-inconnue)'
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    23503,
    NULL,
    'EST_SUIVI ne peut pas référencer une définition absente'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule = 'PROGRESSION_SNBC(test-formule-source-inconnue, 2019)'
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    23503,
    NULL,
    'PROGRESSION_SNBC ne peut pas référencer une définition absente'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule = 'REDUCTION(test-formule-source-inconnue, 2019, 2030, 40)'
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    23503,
    NULL,
    'REDUCTION ne peut pas référencer une définition absente'
);

SELECT lives_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule =
            'EST_SUIVI(test-formule-source-annuelle)'
            || ' + PROGRESSION_SNBC(test-formule-source-annuelle, 2019)'
            || ' + REDUCTION(test-formule-source-annuelle, 2019, 2030, 40)'
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    'Les fonctions de suivi et de progression acceptent une source annuelle existante'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET periodicite = 'mensuelle'
        WHERE identifiant_referentiel = 'test-formule-source-annuelle'
    $$,
    23514,
    NULL,
    'La préparation conserve la restriction annuelle sur une source de formule'
);

SELECT throws_ok(
    $$
        DELETE FROM public.indicateur_definition
        WHERE identifiant_referentiel = 'test-formule-source-annuelle'
    $$,
    23503,
    NULL,
    'Supprimer une source encore référencée est refusé'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET periodicite = 'mensuelle'
        WHERE identifiant_referentiel IN (
            'test-formule-source-annuelle',
            'test-formule-cible'
        )
    $$,
    23514,
    NULL,
    'La modification simultanée d un graphe ne contourne pas la restriction annuelle'
);

SELECT lives_ok(
    $$
        INSERT INTO public.indicateur_definition
            (identifiant_referentiel, titre, unite, periodicite, valeur_calcule)
        VALUES
            ('test-formule-cible-secondaire', 'Formule secondaire', 'kWh', 'annuelle',
             'val(TEST-formule-source-secondaire)')
    $$,
    'Une formule retrouve une source annuelle indépendamment de la casse de son identifiant'
);

SELECT throws_ok(
    $$
        DELETE FROM public.indicateur_definition
        WHERE identifiant_referentiel = 'Test-Formule-Source-Secondaire'
    $$,
    23503,
    NULL,
    'Supprimer une source référencée avec une casse différente est refusé'
);

SELECT lives_ok(
    $$
        UPDATE public.indicateur_definition
        SET identifiant_referentiel = 'test-formule-source-secondaire'
        WHERE identifiant_referentiel = 'Test-Formule-Source-Secondaire'
    $$,
    'Changer uniquement la casse d une source conserve ses références'
);

SELECT lives_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule = NULL
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    'Retirer une formule retire aussi son invariant de dépendance'
);

SELECT lives_ok(
    $$
        DELETE FROM public.indicateur_definition
        WHERE identifiant_referentiel = 'test-formule-source-annuelle'
    $$,
    'Une source peut être supprimée dès que sa formule a été retirée'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET identifiant_referentiel = 'test-formule-source-renommee'
        WHERE identifiant_referentiel = 'test-formule-source-secondaire'
    $$,
    23503,
    NULL,
    'Renommer une source encore référencée est refusé'
);

SELECT lives_ok(
    $$
        SET CONSTRAINTS verifier_periodicite_dependances_formule DEFERRED;
        UPDATE public.indicateur_definition
        SET identifiant_referentiel = 'test-formule-source-renommee'
        WHERE identifiant_referentiel = 'test-formule-source-secondaire';
        UPDATE public.indicateur_definition
        SET valeur_calcule = 'val(test-formule-source-renommee)'
        WHERE identifiant_referentiel = 'test-formule-cible-secondaire';
        SET CONSTRAINTS verifier_periodicite_dependances_formule IMMEDIATE;
    $$,
    'Une transaction peut renommer une source et adapter sa formule avant validation'
);

SELECT lives_ok(
    $$
        INSERT INTO public.indicateur_definition
            (identifiant_referentiel, titre, unite, periodicite, valeur_calcule)
        VALUES
            ('test-formule-cible-lot', 'Formule du lot', 'kWh', 'annuelle',
             'val(test-formule-source-lot)'),
            ('test-formule-source-lot', 'Source du lot', 'kWh', 'annuelle', NULL)
    $$,
    'Un lot peut créer une formule avant sa source dans la même instruction'
);

SELECT * FROM finish();
ROLLBACK;
